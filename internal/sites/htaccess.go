package sites

import (
	"regexp"
	"strings"
)

// ConvertHtaccess converts .htaccess directives to nginx-compatible directives.
func ConvertHtaccess(content string) string {
	var result []string
	lines := strings.Split(strings.ReplaceAll(content, "\r\n", "\n"), "\n")

	var conditions []string

	for _, raw := range lines {
		line := strings.TrimSpace(raw)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		lower := strings.ToLower(line)

		switch {
		// ── Ignore ────────────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "rewriteengine"),
			strings.HasPrefix(lower, "rewritebase"),
			strings.HasPrefix(lower, "options followsymlinks"),
			strings.HasPrefix(lower, "options +followsymlinks"),
			strings.HasPrefix(lower, "options symlinksifownermatch"),
			strings.HasPrefix(lower, "options +symlinksifownermatch"):
			continue

		// ── Options ───────────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "options"):
			if strings.Contains(lower, "-indexes") {
				result = append(result, "autoindex off;")
			} else if strings.Contains(lower, "+indexes") {
				result = append(result, "autoindex on;")
			}

		// ── DirectoryIndex ────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "directoryindex"):
			parts := strings.Fields(line)
			if len(parts) > 1 {
				result = append(result, "index "+strings.Join(parts[1:], " ")+";")
			}

		// ── ErrorDocument ─────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "errordocument"):
			parts := strings.Fields(line)
			if len(parts) == 3 {
				result = append(result, "error_page "+parts[1]+" "+parts[2]+";")
			}

		// ── Header ────────────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "header"):
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				action := strings.ToLower(parts[1])
				idx := 2
				if action == "always" {
					idx = 3
				}
				if (action == "set" || action == "add" || action == "always") && idx+1 < len(parts) {
					result = append(result, "add_header "+parts[idx]+" "+strings.Join(parts[idx+1:], " ")+";")
				}
			}

		// ── RedirectPermanent ─────────────────────────────────────────────────
		case strings.HasPrefix(lower, "redirectpermanent"):
			parts := strings.Fields(line)
			if len(parts) >= 3 {
				result = append(result, "return 301 "+parts[len(parts)-1]+";")
			}

		// ── Redirect ──────────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "redirect"):
			parts := strings.Fields(line)
			if len(parts) >= 3 {
				code := "302"
				dest := parts[len(parts)-1]
				second := strings.ToLower(parts[1])
				if second == "301" || second == "permanent" {
					code = "301"
				} else if second == "302" || second == "temp" {
					code = "302"
				}
				result = append(result, "return "+code+" "+dest+";")
			}

		// ── Deny/Allow ────────────────────────────────────────────────────────
		case lower == "deny from all":
			result = append(result, "deny all;")

		case lower == "allow from all":
			result = append(result, "allow all;")

		// ── RewriteCond ───────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "rewritecond"):
			conditions = append(conditions, line)

		// ── RewriteRule ───────────────────────────────────────────────────────
		case strings.HasPrefix(lower, "rewriterule"):
			nginx := convertRewriteRule(line, conditions)
			if nginx != "" {
				result = append(result, nginx)
			}
			conditions = nil

		// ── Unknown ───────────────────────────────────────────────────────────
		default:
			result = append(result, "# [htaccess] "+line)
		}
	}

	return strings.Join(result, "\n")
}

func convertRewriteRule(line string, conditions []string) string {
	parts := strings.Fields(line)
	if len(parts) < 3 {
		return "# [htaccess] " + line
	}

	pattern := parts[1]
	substitution := parts[2]
	flags := ""
	if len(parts) >= 4 {
		flags = strings.ToLower(parts[3])
	}

	// No-op
	if substitution == "-" {
		return ""
	}

	// Redirect flags
	if strings.Contains(flags, "r=301") {
		dest := toAbsPath(substitution)
		return "return 301 " + dest + ";"
	}
	if strings.Contains(flags, "r=302") || isRedirectFlag(flags) {
		dest := toAbsPath(substitution)
		return "return 302 " + dest + ";"
	}

	// Detect front-controller pattern (most common for PHP frameworks)
	hasNotFile := false
	hasNotDir := false
	for _, c := range conditions {
		cl := strings.ToLower(c)
		if strings.Contains(cl, "!-f") {
			hasNotFile = true
		}
		if strings.Contains(cl, "!-d") {
			hasNotDir = true
		}
	}

	subLower := strings.ToLower(substitution)
	isIndexPHP := strings.HasPrefix(subLower, "index.php") || strings.HasPrefix(subLower, "/index.php")

	if isIndexPHP && (hasNotFile || hasNotDir || len(conditions) == 0) {
		return "try_files $uri $uri/ /index.php?$query_string;"
	}

	// General rewrite: translate Apache regex to nginx
	nginxPattern := pattern
	if !strings.HasPrefix(nginxPattern, "^/") && strings.HasPrefix(nginxPattern, "^") {
		nginxPattern = "^/" + nginxPattern[1:]
	} else if !strings.HasPrefix(nginxPattern, "/") && !strings.HasPrefix(nginxPattern, "^") {
		nginxPattern = "/" + nginxPattern
	}

	// Convert %1 → $1 (Apache back-references)
	nginxSubst := regexp.MustCompile(`%([0-9])`).ReplaceAllString(substitution, `$$1`)
	nginxSubst = toAbsPath(nginxSubst)

	// Nginx flag
	nginxFlag := "last"
	if strings.Contains(flags, "permanent") {
		return "return 301 " + nginxSubst + ";"
	}

	return "rewrite " + nginxPattern + " " + nginxSubst + " " + nginxFlag + ";"
}

func isRedirectFlag(flags string) bool {
	return strings.Contains(flags, ",r]") || strings.Contains(flags, "[r]") ||
		strings.Contains(flags, ",r,") || strings.HasSuffix(flags, ",r")
}

func toAbsPath(s string) string {
	if strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://") {
		return s
	}
	if !strings.HasPrefix(s, "/") {
		return "/" + s
	}
	return s
}
