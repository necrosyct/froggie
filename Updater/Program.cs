using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace FroggieUpdater
{
    class Program
    {
        private static readonly string InstallDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Froggie");
        private static readonly string AppExe = Path.Combine(InstallDir, "FroggieApp.exe");
        private static readonly string LocalVersionFile = Path.Combine(InstallDir, "version.json");
        private static readonly HttpClient http = new HttpClient();

        [STAThread]
        static async Task Main(string[] args)
        {
            string? downloadUrl = null;
            string? newVersion = null;

            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--url" && i + 1 < args.Length)
                    downloadUrl = args[++i];
                if (args[i] == "--version" && i + 1 < args.Length)
                    newVersion = args[++i];
            }

            if (string.IsNullOrEmpty(downloadUrl))
            {
                Console.WriteLine("Usage: Updater.exe --url <zip_url> --version <version>");
                return;
            }

            Console.WriteLine("Froggie Updater");
            Console.WriteLine("===============");

            // Wait for FroggieApp.exe to close
            Console.WriteLine("Waiting for Froggie to close...");
            for (int i = 0; i < 300; i++) // Wait up to 30 seconds
            {
                var procs = Process.GetProcessesByName("FroggieApp");
                if (procs.Length == 0) break;
                await Task.Delay(100);
            }

            // Extra safety delay
            await Task.Delay(500);

            try
            {
                // Download
                Console.WriteLine($"Downloading update...");
                http.DefaultRequestHeaders.UserAgent.Clear();
                http.DefaultRequestHeaders.UserAgent.ParseAdd("FroggieUpdater/1.0");
                var tempZip = Path.Combine(Path.GetTempPath(), "Froggie-update.zip");
                
                using (var response = await http.GetAsync(downloadUrl))
                {
                    response.EnsureSuccessStatusCode();
                    using var stream = await response.Content.ReadAsStreamAsync();
                    using var fileStream = new FileStream(tempZip, FileMode.Create, FileAccess.Write);
                    await stream.CopyToAsync(fileStream);
                }

                // Extract
                Console.WriteLine("Extracting update...");
                ZipFile.ExtractToDirectory(tempZip, InstallDir, true);

                // Update local version.json
                if (!string.IsNullOrEmpty(newVersion))
                {
                    var json = JsonSerializer.Serialize(new { version = newVersion }, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(LocalVersionFile, json);
                }

                // Cleanup
                try { File.Delete(tempZip); } catch { }

                Console.WriteLine("Update complete! Launching Froggie...");

                // Launch the app
                Process.Start(new ProcessStartInfo
                {
                    FileName = AppExe,
                    WorkingDirectory = InstallDir,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Update failed: {ex.Message}");
                Console.WriteLine("Press any key to exit...");
                Console.ReadKey();

                // Try to launch old version anyway
                if (File.Exists(AppExe))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = AppExe,
                        WorkingDirectory = InstallDir,
                        UseShellExecute = true
                    });
                }
            }
        }
    }
}
