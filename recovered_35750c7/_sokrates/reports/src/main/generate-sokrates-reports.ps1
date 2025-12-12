# Script PowerShell pour générer les rapports Sokrates complets
# Usage: .\generate-sokrates-reports.ps1

param(
    [switch]$NoOpen,  # Ne pas ouvrir les rapports, juste les générer
    [switch]$Verbose  # Afficher plus de détails
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sokrates Report Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Java est disponible
Write-Host "Verification de Java..." -ForegroundColor Yellow
$javaCheck = java -version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Java n'est pas installe ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}
Write-Host "Java trouve" -ForegroundColor Green

# Vérifier que le jar Sokrates existe
Write-Host "Verification de Sokrates JAR..." -ForegroundColor Yellow
if (-not (Test-Path ".\sokrates\sokrates-LATEST.jar")) {
    Write-Host "sokrates\sokrates-LATEST.jar non trouve" -ForegroundColor Red
    exit 1
}
Write-Host "Sokrates JAR trouve" -ForegroundColor Green

# Générer les rapports
Write-Host ""
Write-Host "Generation des rapports Sokrates..." -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
java -jar .\sokrates\sokrates-LATEST.jar generateReports > sokrates_run.log 2>&1
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

# Afficher les dernières lignes du log
Write-Host "Dernieres lignes du log:" -ForegroundColor Yellow
Write-Host "---" -ForegroundColor Gray
Get-Content .\sokrates_run.log -Tail 30
Write-Host "---" -ForegroundColor Gray
Write-Host ""
Write-Host "Rapports generes en ${duration:F2} secondes" -ForegroundColor Green
Write-Host ""

if (-not $NoOpen) {
    Write-Host "Ouverture des rapports..." -ForegroundColor Cyan
    Write-Host ""
    
    $reports = @(
        @{
            Name = "Dashboard Principal (index.html)"
            Path = ".\_sokrates\reports\html\index.html"
        },
        @{
            Name = "Rapport Duplication (HTML)"
            Path = ".\_sokrates\reports\html\Duplication.html"
        },
        @{
            Name = "Structure and Composants"
            Path = ".\_sokrates\reports\html\Structure.html"
        },
        @{
            Name = "Taille des Fichiers"
            Path = ".\_sokrates\reports\html\FileSize.html"
        },
        @{
            Name = "Complexite Conditionnelle"
            Path = ".\_sokrates\reports\html\ConditionalComplexity.html"
        },
        @{
            Name = "Tendances (Trend)"
            Path = ".\_sokrates\reports\html\Trend.html"
        },
        @{
            Name = "Taille des Unites"
            Path = ".\_sokrates\reports\html\UnitSize.html"
        },
        @{
            Name = "Metriques Completes (TXT)"
            Path = ".\_sokrates\reports\data\text\metrics.txt"
        },
        @{
            Name = "Liste Complète des Doublons (TXT - 3349 blocs)"
            Path = ".\_sokrates\reports\data\text\duplicates.txt"
        },
        @{
            Name = "Unites and Fonctions (TXT)"
            Path = ".\_sokrates\reports\data\text\units.txt"
        },
        @{
            Name = "Resume Textuel Complet"
            Path = ".\_sokrates\reports\data\text\textualSummary.txt"
        },
        @{
            Name = "Composants Backend"
            Path = ".\_sokrates\reports\data\text\aspect_component_primary_backend.txt"
        },
        @{
            Name = "Composants SPL (Frontend)"
            Path = ".\_sokrates\reports\data\text\aspect_component_primary_SPL.txt"
        },
        @{
            Name = "Dependencies"
            Path = ".\_sokrates\reports\data\text\dependencies_primary.txt"
        },
        @{
            Name = "Fichiers avec Historique"
            Path = ".\_sokrates\reports\data\text\mainFilesWithHistory.txt"
        },
        @{
            Name = "Explorateur Fichiers (HTML)"
            Path = ".\_sokrates\reports\html\files-explorer.html"
        },
        @{
            Name = "Controles and Objectifs"
            Path = ".\_sokrates\reports\html\Controls.html"
        }
    )
    
    $openedCount = 0
    foreach ($report in $reports) {
        if (Test-Path $report.Path) {
            Write-Host "  >> Ouverture: $($report.Name)" -ForegroundColor Green
            Start-Process $report.Path
            $openedCount++
            Start-Sleep -Milliseconds 300
        } else {
            Write-Host "  X Fichier non trouve: $($report.Path)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "$openedCount rapport(s) ouvert(s)" -ForegroundColor Green
} else {
    Write-Host "Mode sans-ouverture active" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generation terminee avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers de rapport disponibles:" -ForegroundColor Yellow
Write-Host "   HTML:  .\_sokrates\reports\html\" -ForegroundColor Gray
Write-Host "   Data:  .\_sokrates\reports\data\text\" -ForegroundColor Gray
Write-Host "   JSON:  .\_sokrates\reports\data\" -ForegroundColor Gray
Write-Host ""
