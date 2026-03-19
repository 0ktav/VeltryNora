package main

import (
	"context"
	"embed"
	"nginxpanel/internal/config"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/windows/icon.ico
var appIcon []byte

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:            "VeltryNora",
		Width:            1280,
		Height:           800,
		MinWidth:         1024,
		MinHeight:        640,
		BackgroundColour: &options.RGBA{R: 8, G: 12, B: 16, A: 1},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			go initTray(ctx, app)
		},
		OnBeforeClose: func(ctx context.Context) (prevent bool) {
			s := config.LoadSettings()
			if s.MinimizeToTray {
				runtime.WindowHide(ctx)
				return true
			}
			if s.AutoStop {
				app.StopAllServices()
			}
			return false
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func initTray(ctx context.Context, app *App) {
	systray.Run(func() {
		systray.SetIcon(appIcon)
		systray.SetTitle("VeltryNora")
		systray.SetTooltip("VeltryNora")

		showWindow := func() {
			runtime.WindowShow(ctx)
			runtime.WindowSetAlwaysOnTop(ctx, true)
			runtime.WindowSetAlwaysOnTop(ctx, false)
		}

		// Show window on left click / double click on tray icon
		systray.SetOnClick(func(menu systray.IMenu) {
			showWindow()
		})
		systray.SetOnDClick(func(menu systray.IMenu) {
			showWindow()
		})

		mOpen := systray.AddMenuItem("Open VeltryNora", "")
		systray.AddSeparator()
		mQuit := systray.AddMenuItem("Quit", "")

		mOpen.Click(func() {
			showWindow()
		})

		mQuit.Click(func() {
			s := config.LoadSettings()
			if s.AutoStop {
				app.StopAllServices()
			}
			systray.Quit()
			runtime.Quit(ctx)
		})
	}, func() {})
}
