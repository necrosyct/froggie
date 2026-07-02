using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;

namespace FroggieLauncher
{
    public class App : Application
    {
        [STAThread]
        public static void Main()
        {
            var app = new App();
            var window = new SplashWindow();
            app.Run(window);
        }
    }

    public class SplashWindow : Window
    {
        private readonly TextBlock statusText;
        private readonly ProgressBar progressBar;
        private static readonly string InstallDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Froggie");
        private static readonly string AppExe = Path.Combine(InstallDir, "FroggieApp.exe");
        private static readonly string LocalVersionFile = Path.Combine(InstallDir, "version.json");
        private const string RemoteVersionUrl = "https://raw.githubusercontent.com/necrosyct/froggie/main/version.json";
        private static readonly HttpClient http = new HttpClient();

        public SplashWindow()
        {
            Title = "Froggie Launcher";
            Width = 420; Height = 260;
            WindowStyle = WindowStyle.None;
            AllowsTransparency = true;
            Background = Brushes.Transparent;
            WindowStartupLocation = WindowStartupLocation.CenterScreen;
            ResizeMode = ResizeMode.NoResize;

            var border = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0c0c0e")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1a1a22")),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(30)
            };

            var stack = new StackPanel { VerticalAlignment = VerticalAlignment.Center };

            var logo = new TextBlock
            {
                Text = "🐸 Froggie",
                FontSize = 28, FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#39ff14")),
                HorizontalAlignment = HorizontalAlignment.Center,
                Margin = new Thickness(0, 0, 0, 20)
            };

            statusText = new TextBlock
            {
                Text = "Checking for updates...",
                FontSize = 13,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#a0a0b0")),
                HorizontalAlignment = HorizontalAlignment.Center,
                Margin = new Thickness(0, 0, 0, 15)
            };

            progressBar = new ProgressBar
            {
                Height = 6,
                IsIndeterminate = true,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#39ff14")),
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1a1a22")),
                BorderThickness = new Thickness(0)
            };

            stack.Children.Add(logo);
            stack.Children.Add(statusText);
            stack.Children.Add(progressBar);
            border.Child = stack;
            Content = border;

            Loaded += async (s, e) => await RunAsync();
        }

        private void SetStatus(string text)
        {
            Dispatcher.Invoke(() => statusText.Text = text);
        }

        private async Task RunAsync()
        {
            try
            {
                if (!File.Exists(AppExe))
                {
                    // First install
                    SetStatus("Installing Froggie...");
                    var remoteVersion = await FetchRemoteVersion();
                    if (remoteVersion == null)
                    {
                        MessageBox.Show("Could not reach update server. Please check your internet connection.", "Froggie", MessageBoxButton.OK, MessageBoxImage.Error);
                        Application.Current.Shutdown();
                        return;
                    }
                    await DownloadAndExtract(remoteVersion.DownloadUrl);
                    SaveLocalVersion(remoteVersion.Version);
                    LaunchApp();
                }
                else
                {
                    // Check for updates
                    SetStatus("Checking for updates...");
                    var localVer = ReadLocalVersion();
                    var remoteVersion = await FetchRemoteVersion();

                    if (remoteVersion != null && localVer != remoteVersion.Version)
                    {
                        SetStatus($"Updating to v{remoteVersion.Version}...");
                        // Launch updater
                        var updaterPath = Path.Combine(InstallDir, "Updater.exe");
                        if (File.Exists(updaterPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = updaterPath,
                                Arguments = $"--url \"{remoteVersion.DownloadUrl}\" --version \"{remoteVersion.Version}\"",
                                WorkingDirectory = InstallDir
                            });
                            Application.Current.Shutdown();
                            return;
                        }
                        else
                        {
                            // No updater yet, do inline update
                            await DownloadAndExtract(remoteVersion.DownloadUrl);
                            SaveLocalVersion(remoteVersion.Version);
                            LaunchApp();
                        }
                    }
                    else
                    {
                        LaunchApp();
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Froggie Launcher", MessageBoxButton.OK, MessageBoxImage.Error);
                // Try to launch anyway if installed
                if (File.Exists(AppExe))
                    LaunchApp();
                else
                    Application.Current.Shutdown();
            }
        }

        private async Task<VersionInfo?> FetchRemoteVersion()
        {
            try
            {
                http.DefaultRequestHeaders.UserAgent.Clear();
                http.DefaultRequestHeaders.UserAgent.ParseAdd("FroggieLauncher/1.0");
                var json = await http.GetStringAsync(RemoteVersionUrl);
                return JsonSerializer.Deserialize<VersionInfo>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch
            {
                return null;
            }
        }

        private string ReadLocalVersion()
        {
            try
            {
                if (File.Exists(LocalVersionFile))
                {
                    var json = File.ReadAllText(LocalVersionFile);
                    var info = JsonSerializer.Deserialize<VersionInfo>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    return info?.Version ?? "0.0.0";
                }
            }
            catch { }
            return "0.0.0";
        }

        private void SaveLocalVersion(string version)
        {
            var json = JsonSerializer.Serialize(new { version }, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(LocalVersionFile, json);
        }

        private async Task DownloadAndExtract(string url)
        {
            Directory.CreateDirectory(InstallDir);
            var tempZip = Path.Combine(Path.GetTempPath(), "Froggie-update.zip");

            SetStatus("Downloading...");
            Dispatcher.Invoke(() => { progressBar.IsIndeterminate = false; progressBar.Value = 0; });

            using (var response = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead))
            {
                response.EnsureSuccessStatusCode();
                var totalBytes = response.Content.Headers.ContentLength ?? -1;
                long downloaded = 0;

                using var stream = await response.Content.ReadAsStreamAsync();
                using var fileStream = new FileStream(tempZip, FileMode.Create, FileAccess.Write);
                var buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                {
                    await fileStream.WriteAsync(buffer, 0, bytesRead);
                    downloaded += bytesRead;
                    if (totalBytes > 0)
                    {
                        var pct = (double)downloaded / totalBytes * 100;
                        Dispatcher.Invoke(() => progressBar.Value = pct);
                    }
                }
            }

            SetStatus("Extracting...");
            Dispatcher.Invoke(() => progressBar.IsIndeterminate = true);

            // Extract ZIP, overwriting existing files
            ZipFile.ExtractToDirectory(tempZip, InstallDir, true);

            try { File.Delete(tempZip); } catch { }
        }

        private void LaunchApp()
        {
            SetStatus("Launching Froggie...");
            Process.Start(new ProcessStartInfo
            {
                FileName = AppExe,
                WorkingDirectory = InstallDir
            });
            Dispatcher.Invoke(() => Application.Current.Shutdown());
        }
    }

    public class VersionInfo
    {
        public string Version { get; set; } = "0.0.0";

        [System.Text.Json.Serialization.JsonPropertyName("download_url")]
        public string DownloadUrl { get; set; } = "";
    }
}
