#define AppName "VeltryNora"
#define AppVersion "1.0.0"
#define AppPublisher "0ktav"
#define AppURL "https://github.com/0ktav/VeltryNora"
#define AppExeName "VeltryNora.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}/releases
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
AllowNoIcons=yes
LicenseFile=LICENSE
OutputDir=build\bin
OutputBaseFilename=VeltryNora-Setup
SetupIconFile=build\windows\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce
Name: "startmenuicon"; Description: "Create a &Start Menu shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce

[Files]
Source: "build\bin\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: startmenuicon
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"; Tasks: startmenuicon
Name: "{commondesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch {#AppName}"; Flags: nowait postinstall skipifsilent shellexec

[Code]
var
  ShouldDeleteData: Boolean;

function InitializeUninstall(): Boolean;
var
  MsgResult: Integer;
begin
  ShouldDeleteData := False;
  MsgResult := MsgBox(
    'Do you also want to delete all application data?' + #13#10 +
    '(Nginx, PHP, Redis, sites, logs, etc.)' + #13#10#13#10 +
    'Warning: this action cannot be undone.',
    mbConfirmation, MB_YESNOCANCEL);
  if MsgResult = IDCANCEL then
  begin
    Result := False;
    Exit;
  end;
  if MsgResult = IDYES then
    ShouldDeleteData := True;
  Result := True;
end;

procedure DeinitializeUninstall();
begin
  if ShouldDeleteData then
    DelTree(ExpandConstant('{app}'), True, True, True);
end;

procedure CurPageChanged(CurPageID: Integer);
var
  HintLabel: TNewStaticText;
begin
  if CurPageID = wpSelectDir then
  begin
    HintLabel := TNewStaticText.Create(WizardForm);
    HintLabel.Parent := WizardForm.SelectDirPage;
    HintLabel.Left := 0;
    HintLabel.Top := WizardForm.DirEdit.Top + WizardForm.DirEdit.Height + 8;
    HintLabel.Width := WizardForm.SelectDirPage.Width;
    HintLabel.Caption := '⚠ Recommended: install on a non-system drive (e.g. D:\VeltryNora).' + #13#10 + '     This will avoid permission issues when running services like Nginx, PHP and Redis.';
    HintLabel.Font.Color := $0080C0;
    HintLabel.WordWrap := True;
    HintLabel.AutoSize := True;
  end;
end;

