using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using QuorumAPI;
using System.Drawing;
using Microsoft.Web.WebView2.Core;
using System.Windows.Media;
using System.Windows.Media.Animation;
using DiscordRPC;

namespace Froggie
{
    public partial class MainWindow : Window
    {
        private QuorumModule quorum = null!;
        private readonly string scriptsFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "scripts");
        private readonly string autoexecFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "autoexec");
        private readonly string workspaceFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "workspace");
        private bool isDragging = false;
        private System.Windows.Point dragStartPoint;
        private DiscordRpcClient? rpcClient;

        // Win32 API Imports for Dragging and Process Hiding
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern bool ReleaseCapture();

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern IntPtr SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HTCAPTION = 0x2;
        private const int SW_HIDE = 0;

        public MainWindow()
        {
            InitializeComponent();
            InitializeQuorum();
            _ = InitializeWebViewAsync();
            this.StateChanged += Window_StateChanged;
        }

        // ------ Window Drag ------

        private void DragBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ClickCount == 2)
            {
                ToggleMaximize();
                return;
            }

            if (WindowState == WindowState.Maximized)
            {
                // Restore before dragging from maximized
                var point = PointToScreen(e.GetPosition(this));
                WindowState = WindowState.Normal;
                Left = point.X - (Width / 2);
                Top = point.Y - 20;
            }

            isDragging = true;
            dragStartPoint = e.GetPosition(this);
            ((UIElement)sender).CaptureMouse();
        }

        private void DragBar_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            isDragging = false;
            ((UIElement)sender).ReleaseMouseCapture();
        }

        private void DragBar_MouseMove(object sender, MouseEventArgs e)
        {
            if (!isDragging) return;

            var currentPoint = PointToScreen(e.GetPosition(this));
            Left = currentPoint.X - dragStartPoint.X;
            Top = currentPoint.Y - dragStartPoint.Y;
        }

        private void ToggleMaximize()
        {
            if (WindowState == WindowState.Maximized)
            {
                WindowState = WindowState.Normal;
            }
            else
            {
                // Account for taskbar
                MaxHeight = SystemParameters.MaximizedPrimaryScreenHeight;
                MaxWidth = SystemParameters.MaximizedPrimaryScreenWidth;
                WindowState = WindowState.Maximized;
            }
        }

        // ------ QuorumAPI Init ------

        private void InitializeQuorum()
        {
            // Initial API configurations
            QuorumAPI.QuorumModule._AutoUpdateLogs = true;

            quorum = new QuorumModule();
            quorum.StartCommunication(); // Very important!

            // ------ Initialize Output ------
            QuorumAPI.QuorumModule.UseOutput(true);
            QuorumAPI.QuorumModule.Logger.OnLog += Logger_OnLog;

            // Configurar tema de cores (usando System.Drawing.Color)
            QuorumAPI.QuorumModule.Logger.SetTheme(new COP.LogTheme
            {
                Info = System.Drawing.Color.White,
                Success = System.Drawing.Color.LimeGreen,
                Warning = System.Drawing.Color.Orange,
                Error = System.Drawing.Color.Red,
                System = System.Drawing.Color.Gray
            });

            // Configure tags format
            QuorumAPI.QuorumModule.Logger.SetFormat(new COP.LogFormat
            {
                InfoTag = "[INFO]",
                SuccessTag = "[SUCCESS]",
                WarningTag = "[WARNING]",
                ErrorTag = "[ERROR]",
                SystemTag = "[SYSTEM]"
            });

            // Configure logs source
            QuorumAPI.QuorumModule.Logger.SetLogSource(COP.LogSource.All);

            // DISABLE auto-attach
            quorum.SetAutoAttach(false);

            // ------ Customization (PREMIUM ONLY) ------
            // QuorumAPI.QuorumModule.UseSpoofer(true);
            // QuorumAPI.QuorumModule.ExecutorInfo.Name = "Froggie";
            // QuorumAPI.QuorumModule.ExecutorInfo.Ver = "v1.0.0";
            // QuorumAPI.QuorumModule.ExecutorInfo.CUA = "Froggie/v1.0.0";
        }

        // ------ Window Actions ------

        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            this.Opacity = 1.0;
        }

        private void PerformCloseAnimation()
        {
            Close();
        }

        private void PerformMinimizeAnimation()
        {
            WindowState = WindowState.Minimized;
        }

        // ------ WebView2 Initialization ------

        private async Task InitializeWebViewAsync()
        {
            try
            {
                // Create workspace folders if not exist
                if (!Directory.Exists(scriptsFolder)) Directory.CreateDirectory(scriptsFolder);
                if (!Directory.Exists(autoexecFolder)) Directory.CreateDirectory(autoexecFolder);
                if (!Directory.Exists(workspaceFolder)) Directory.CreateDirectory(workspaceFolder);

                await webView.EnsureCoreWebView2Async();

                // Map folder UI to the domain https://froggie.local/
                string uiFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "UI");

                // Fallback to project source folder during local development
                if (!Directory.Exists(uiFolder))
                {
                    string projectDir = AppDomain.CurrentDomain.BaseDirectory;
                    for (int i = 0; i < 4 && Directory.Exists(projectDir); i++)
                    {
                        projectDir = Path.GetDirectoryName(projectDir) ?? projectDir;
                    }
                    string devUiFolder = Path.Combine(projectDir, "Froggie", "UI");
                    if (Directory.Exists(devUiFolder))
                    {
                        uiFolder = devUiFolder;
                    }
                }

                webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "froggie.local",
                    uiFolder,
                    CoreWebView2HostResourceAccessKind.Allow);

                webView.Source = new Uri("https://froggie.local/index.html");

                // Listen for messages from JavaScript
                webView.CoreWebView2.WebMessageReceived += WebView_WebMessageReceived;

                // Start Discord RPC
                InitializeDiscordRPC();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error initializing WebView2: {ex.Message}\n{ex.StackTrace}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // ------ JavaScript to C# Communication ------

        private class WebMessage
        {
            public string? Action { get; set; }
            public string? Script { get; set; }
            public string? TabId { get; set; }
            public string? FilePath { get; set; }
            public string? Content { get; set; }
            public string? FileName { get; set; }
            public string? Folder { get; set; }
            public bool? Value { get; set; }
        }

        private async void WebView_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string json = e.WebMessageAsJson;
                var message = JsonSerializer.Deserialize<WebMessage>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (message == null || string.IsNullOrEmpty(message.Action)) return;

                switch (message.Action)
                {
                    case "ui_ready":
                        SendWorkspaceStructure();
                        break;
                    case "inject":
                        await HandleInjectAsync();
                        break;
                    case "execute":
                        HandleExecute(message.Script);
                        break;
                    case "get_scripts":
                        SendWorkspaceStructure();
                        break;
                    case "read_script":
                        HandleReadScript(message.Folder, message.FileName);
                        break;
                    case "open_file":
                        HandleOpenFile();
                        break;
                    case "save_file":
                        HandleSaveFile(message.TabId, message.FilePath, message.Content);
                        break;
                    case "delete_script":
                        HandleDeleteScript(message.Folder, message.FileName);
                        break;
                    case "create_script_file":
                        HandleCreateScriptFile(message.Folder, message.FileName, message.Content);
                        break;
                    case "set_auto_attach":
                        if (message.Value.HasValue)
                        {
                            quorum.SetAutoAttach(message.Value.Value);
                        }
                        break;
                    case "kill_roblox":
                        QuorumAPI.QuorumModule.KillRoblox();
                        SendLogToUI("Terminated Roblox process.", "system");
                        break;
                    case "open_scripts_folder":
                        try
                        {
                            System.Diagnostics.Process.Start("explorer.exe", AppDomain.CurrentDomain.BaseDirectory);
                        }
                        catch (Exception ex)
                        {
                            SendLogToUI($"Error opening base folder: {ex.Message}", "error");
                        }
                        break;
                    case "open_subfolder":
                        try
                        {
                            string target = (message.Folder?.ToLower()) switch
                            {
                                "autoexec" => autoexecFolder,
                                "workspace" => workspaceFolder,
                                _ => scriptsFolder
                            };
                            System.Diagnostics.Process.Start("explorer.exe", target);
                        }
                        catch (Exception ex)
                        {
                            SendLogToUI($"Error opening subfolder: {ex.Message}", "error");
                        }
                        break;
                    case "set_topmost":
                        if (message.Value.HasValue)
                        {
                            Topmost = message.Value.Value;
                            SendLogToUI($"Always On Top: {message.Value.Value}", "system");
                        }
                        break;
                    case "set_lock_window":
                        if (message.Value.HasValue)
                        {
                            ResizeMode = message.Value.Value ? ResizeMode.NoResize : ResizeMode.CanResizeWithGrip;
                            SendLogToUI($"Locked window size: {message.Value.Value}", "system");
                        }
                        break;
                    case "set_discord_rpc":
                        if (message.Value.HasValue)
                        {
                            UpdateDiscordRPC(message.Value.Value);
                        }
                        break;
                    case "window_drag":
                        ReleaseCapture();
                        var helper = new System.Windows.Interop.WindowInteropHelper(this);
                        SendMessage(helper.Handle, WM_NCLBUTTONDOWN, (IntPtr)HTCAPTION, IntPtr.Zero);
                        break;
                    // Window control messages
                    case "window_minimize":
                        PerformMinimizeAnimation();
                        break;
                    case "window_maximize":
                        ToggleMaximize();
                        break;
                    case "window_close":
                        PerformCloseAnimation();
                        break;
                }
            }
            catch (Exception ex)
            {
                SendErrorToUI($"Error processing message: {ex.Message}");
            }
        }

        // ------ IPC Handlers ------

        private async Task HandleInjectAsync()
        {
            SendStatusToUI("injecting", "Injecting API...");
            MonitorAndHideInjector();
            try
            {
                await quorum.AttachAPI();
                var status = quorum.QuorumStatus;
                string resultStr = status.ToString();

                switch (resultStr)
                {
                    case "Attached":
                        SendStatusToUI("injected", "Injected");
                        SendLogToUI("Successfully attached to Roblox!", "success");
                        break;
                    case "NoProcessFound":
                        SendStatusToUI("not_injected", "Not Injected");
                        SendLogToUI("No Roblox process found. Please open Roblox first.", "error");
                        break;
                    case "TamperDetected":
                        SendStatusToUI("not_injected", "Not Injected");
                        SendLogToUI("Tamper detected. Please restart Roblox.", "error");
                        break;
                    default:
                        SendStatusToUI("not_injected", "Not Injected");
                        SendLogToUI($"Attachment result: {resultStr}", "warning");
                        break;
                }
            }
            catch (Exception ex)
            {
                SendStatusToUI("not_injected", "Not Injected");
                SendLogToUI($"Error during injection: {ex.Message}", "error");
            }
        }

        private void HandleExecute(string? script)
        {
            if (string.IsNullOrWhiteSpace(script))
            {
                SendLogToUI("Script is empty.", "warning");
                return;
            }

            if (!quorum.IsAttached())
            {
                SendLogToUI("Please inject first!", "warning");
                return;
            }

            try
            {
                var result = quorum.ExecuteScript(script);
                SendLogToUI($"Script executed! Result: {result}", "success");
            }
            catch (Exception ex)
            {
                SendLogToUI($"Error executing script: {ex.Message}", "error");
            }
        }

        private void SendWorkspaceStructure()
        {
            try
            {
                if (!Directory.Exists(scriptsFolder)) Directory.CreateDirectory(scriptsFolder);
                if (!Directory.Exists(autoexecFolder)) Directory.CreateDirectory(autoexecFolder);
                if (!Directory.Exists(workspaceFolder)) Directory.CreateDirectory(workspaceFolder);

                var scriptsFiles = Directory.GetFiles(scriptsFolder)
                    .Where(f => f.EndsWith(".lua") || f.EndsWith(".txt"))
                    .Select(Path.GetFileName)
                    .ToList();

                var autoexecFiles = Directory.GetFiles(autoexecFolder)
                    .Where(f => f.EndsWith(".lua") || f.EndsWith(".txt"))
                    .Select(Path.GetFileName)
                    .ToList();

                var workspaceFiles = Directory.GetFiles(workspaceFolder)
                    .Where(f => f.EndsWith(".lua") || f.EndsWith(".txt") || f.EndsWith(".json"))
                    .Select(Path.GetFileName)
                    .ToList();

                var payload = new
                {
                    type = "workspace_structure",
                    scripts = scriptsFiles,
                    autoexec = autoexecFiles,
                    workspace = workspaceFiles
                };
                SendJsonToUI(payload);
            }
            catch (Exception ex)
            {
                SendLogToUI($"Error reading workspace structure: {ex.Message}", "error");
            }
        }

        private void HandleDeleteScript(string? folder, string? fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return;
            folder = string.IsNullOrEmpty(folder) ? "scripts" : folder.ToLower();
            try
            {
                string targetDir = folder switch
                {
                    "autoexec" => autoexecFolder,
                    "workspace" => workspaceFolder,
                    _ => scriptsFolder
                };

                string path = Path.Combine(targetDir, fileName);
                if (File.Exists(path))
                {
                    File.Delete(path);
                    SendLogToUI($"Deleted script: {folder}/{fileName}", "success");
                    SendWorkspaceStructure();
                }
            }
            catch (Exception ex)
            {
                SendLogToUI($"Error deleting script: {ex.Message}", "error");
            }
        }

        private void HandleCreateScriptFile(string? folder, string? fileName, string? content)
        {
            if (string.IsNullOrEmpty(fileName)) return;
            content ??= "";
            folder = string.IsNullOrEmpty(folder) ? "scripts" : folder.ToLower();

            if (!fileName.EndsWith(".lua") && !fileName.EndsWith(".txt") && !fileName.EndsWith(".json"))
            {
                fileName += ".lua";
            }

            try
            {
                string targetDir = folder switch
                {
                    "autoexec" => autoexecFolder,
                    "workspace" => workspaceFolder,
                    _ => scriptsFolder
                };

                string path = Path.Combine(targetDir, fileName);
                File.WriteAllText(path, content);
                SendLogToUI($"Created file: {folder}/{fileName}", "success");
                SendWorkspaceStructure();
            }
            catch (Exception ex)
            {
                SendLogToUI($"Error creating script file: {ex.Message}", "error");
            }
        }

        private void HandleReadScript(string? folder, string? fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return;
            folder = string.IsNullOrEmpty(folder) ? "scripts" : folder.ToLower();
            try
            {
                string targetDir = folder switch
                {
                    "autoexec" => autoexecFolder,
                    "workspace" => workspaceFolder,
                    _ => scriptsFolder
                };

                string path = Path.Combine(targetDir, fileName);
                if (File.Exists(path))
                {
                    string content = File.ReadAllText(path);
                    var payload = new
                    {
                        type = "file_opened",
                        fileName = fileName,
                        folder = folder,
                        filePath = path,
                        content = content
                    };
                    SendJsonToUI(payload);
                }
            }
            catch (Exception ex)
            {
                SendLogToUI($"Error reading script file: {ex.Message}", "error");
            }
        }

        private void HandleOpenFile()
        {
            var openFileDialog = new Microsoft.Win32.OpenFileDialog
            {
                Filter = "Lua files (*.lua)|*.lua|Text files (*.txt)|*.txt|All files (*.*)|*.*",
                InitialDirectory = scriptsFolder
            };

            if (openFileDialog.ShowDialog() == true)
            {
                try
                {
                    string path = openFileDialog.FileName;
                    string name = Path.GetFileName(path);
                    string content = File.ReadAllText(path);

                    var payload = new
                    {
                        type = "file_opened",
                        fileName = name,
                        filePath = path,
                        content = content
                    };
                    SendJsonToUI(payload);
                }
                catch (Exception ex)
                {
                    SendLogToUI($"Error opening file: {ex.Message}", "error");
                }
            }
        }

        private void HandleSaveFile(string? tabId, string? filePath, string? content)
        {
            if (string.IsNullOrEmpty(tabId)) return;
            content ??= "";

            if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
            {
                var saveFileDialog = new Microsoft.Win32.SaveFileDialog
                {
                    Filter = "Lua files (*.lua)|*.lua|Text files (*.txt)|*.txt|All files (*.*)|*.*",
                    InitialDirectory = scriptsFolder,
                    FileName = "Untitled.lua"
                };

                if (saveFileDialog.ShowDialog() == true)
                {
                    filePath = saveFileDialog.FileName;
                }
                else
                {
                    return;
                }
            }

            try
            {
                File.WriteAllText(filePath, content);
                string fileName = Path.GetFileName(filePath);

                var payload = new
                {
                    type = "file_saved",
                    tabId = tabId,
                    fileName = fileName,
                    filePath = filePath
                };
                SendJsonToUI(payload);
                SendWorkspaceStructure();
            }
            catch (Exception ex)
            {
                SendLogToUI($"Error saving file: {ex.Message}", "error");
            }
        }

        // ------ C# to JavaScript Communication helpers ------

        private void SendJsonToUI(object obj)
        {
            if (webView?.CoreWebView2 == null) return;
            string json = JsonSerializer.Serialize(obj);
            Dispatcher.Invoke(() =>
            {
                try
                {
                    webView.CoreWebView2.PostWebMessageAsJson(json);
                }
                catch (Exception)
                {
                    // Ignore if WebView is closed or disposed
                }
            });
        }

        private void SendStatusToUI(string status, string text)
        {
            SendJsonToUI(new { type = "inject_status", status, text });
        }

        private void SendLogToUI(string message, string level)
        {
            SendJsonToUI(new { type = "log", message, level });
        }

        private void SendErrorToUI(string message)
        {
            SendJsonToUI(new { type = "error", message });
        }

        // ------ Output Logger Bridge ------

        private void Logger_OnLog(string message, System.Drawing.Color color)
        {
            string level = "info";
            if (color == System.Drawing.Color.LimeGreen) level = "success";
            else if (color == System.Drawing.Color.Orange) level = "warning";
            else if (color == System.Drawing.Color.Red) level = "error";
            else if (color == System.Drawing.Color.Gray) level = "system";

            SendLogToUI(message, level);
        }

        private void Window_StateChanged(object? sender, EventArgs e)
        {
            if (WindowState == WindowState.Normal)
            {
                SendJsonToUI(new { type = "window_restored" });
            }
        }

        private void MonitorAndHideInjector()
        {
            Task.Run(async () =>
            {
                // Scan processes for 7.5 seconds (150 * 50ms) to hide erto3e4rortoergn console window instantly
                for (int i = 0; i < 150; i++)
                {
                    try
                    {
                        var processes = System.Diagnostics.Process.GetProcesses();
                        foreach (var p in processes)
                        {
                            if (p.ProcessName.Contains("erto3e4rortoergn") || p.ProcessName.Contains("erto3e"))
                            {
                                IntPtr handle = p.MainWindowHandle;
                                if (handle != IntPtr.Zero)
                                {
                                    ShowWindow(handle, SW_HIDE);
                                }
                            }
                        }
                    }
                    catch { }
                    await Task.Delay(50);
                }
            });
        }

        private void InitializeDiscordRPC()
        {
            try
            {
                rpcClient = new DiscordRpcClient("1522348590687719625");
                rpcClient.Initialize();
                UpdateDiscordRPC(true);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Discord RPC Error: {ex.Message}");
            }
        }

        private void UpdateDiscordRPC(bool isEnabled)
        {
            if (rpcClient == null) return;
            if (!isEnabled)
            {
                rpcClient.ClearPresence();
                return;
            }
            try
            {
                rpcClient.SetPresence(new RichPresence()
                {
                    Details = "Coding scripts",
                    State = "Using Froggie",
                    Assets = new Assets()
                    {
                        LargeImageKey = "frog_icon",
                        LargeImageText = "Froggie",
                        SmallImageKey = "roblox_logo",
                        SmallImageText = "Roblox"
                    },
                    Timestamps = Timestamps.Now
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Discord RPC Update Error: {ex.Message}");
            }
        }

        // ------ Cleanup ------

        private void Window_Closed(object sender, EventArgs e)
        {
            quorum?.StopCommunication();
            if (rpcClient != null)
            {
                rpcClient.Dispose();
                rpcClient = null;
            }
        }
    }
}