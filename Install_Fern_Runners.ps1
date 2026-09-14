$ErrorActionPreference = 'Stop'
try {
 $root = $PSScriptRoot
 $target = Join-Path $root 'src\scenes\SubmapGames.js'
 if (!(Test-Path -LiteralPath $target)) { throw 'Place this update beside the main game index.html, then run it again.' }
 $source = [IO.File]::ReadAllText($target)
 $import = "import { createFernRunnerNode } from './FernRunnerMapLink.js';"
 $hook = 'if (createFernRunnerNode(this, x, y, index)) return;'
 $hasImport = $source.Contains($import)
 $hasHook = $source.Contains($hook)
 if ($hasImport -and $hasHook) { Write-Host 'Already installed. New runner files are ready.'; exit 0 }
 if ($hasImport -or $hasHook) { throw 'Partial integration detected. No map file was changed.' }
 $pattern = '(?m)(^[ \t]*createComingSoonBubble\(x, y, index = 0\)\s*\{)'
 $rx = [regex]::new($pattern)
 if ($rx.Matches($source).Count -ne 1) { throw 'The map method differs from the supported version. No map file was changed.' }
 foreach ($relative in @('src\scenes\FernRunnerGame.js','src\scenes\FernRunnerMapLink.js','src\data\FernRunnerSettings.js')) {
  if (!(Test-Path -LiteralPath (Join-Path $root $relative))) { throw "Missing update file: $relative" }
 }
 $patched = $import + "`r`n" + $rx.Replace($source, '$1' + "`r`n        " + $hook, 1)
 $backupDir = Join-Path $root ('backups\fern_map_' + (Get-Date -Format 'yyyyMMdd_HHmmss_fff'))
 New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
 Copy-Item -LiteralPath $target -Destination (Join-Path $backupDir 'SubmapGames.js')
 $temp = $target + '.fern-install.tmp'
 [IO.File]::WriteAllText($temp,$patched,[Text.UTF8Encoding]::new($false))
 Move-Item -LiteralPath $temp -Destination $target -Force
 Write-Host 'Installed: Dinosaur region > Giant Fern Jungle > Treehouse / Footprints.'
 Write-Host 'Restart the game. Press Ctrl+F5 if the old map is cached.'
 Write-Host ('Backup: ' + $backupDir)
} catch { Write-Host ('INSTALL FAILED: ' + $_.Exception.Message); exit 1 }
