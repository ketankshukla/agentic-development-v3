<# 
.SYNOPSIS
    Generates DOCX from manuscript markdown files using Pandoc.

.DESCRIPTION
    Combines manuscript files (excluding audiobook-only files) and converts to DOCX.
    Outputs to books/[genre]/[book-slug]/05-output/

.PARAMETER BookPath
    Full path to the book folder

.PARAMETER Author
    Author name for metadata

.PARAMETER Title
    Book title for metadata and filename

.EXAMPLE
    .\generate-docx.ps1 -BookPath "E:\books\epic-fantasy\the-ashen-throne" -Author "Ketan Shukla" -Title "The Ashen Throne"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$BookPath,
    
    [Parameter(Mandatory=$true)]
    [string]$Author,
    
    [Parameter(Mandatory=$true)]
    [string]$Title
)

# ── Configuration ───────────────────────────────────────────────────────────
$PANDOC = "pandoc"

# ── Sanitize filename ───────────────────────────────────────────────────────
$SafeTitle = $Title -replace '[:/\\*?"<>|]', '-'
$SafeTitle = $SafeTitle.Trim()

# ── Paths ───────────────────────────────────────────────────────────────────
$ManuscriptDir = Join-Path $BookPath "02-manuscript"
$OutputDir = Join-Path $BookPath "05-output"
$OutputFile = Join-Path $OutputDir "$Author - $SafeTitle.docx"

# ── Validate manuscript directory ───────────────────────────────────────────
if (-not (Test-Path $ManuscriptDir)) {
    Write-Error "Manuscript directory not found: $ManuscriptDir"
    exit 1
}

# ── Create output directory if needed ───────────────────────────────────────
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# ── Get manuscript files (exclude audiobook-only: 00, 19, 20) ───────────────
$ExcludedPrefixes = @("00-", "19-", "20-")
$ManuscriptFiles = Get-ChildItem -Path $ManuscriptDir -Filter "*.md" |
    Where-Object { 
        $name = $_.Name
        -not ($ExcludedPrefixes | Where-Object { $name.StartsWith($_) }) 
    } |
    Sort-Object Name

if ($ManuscriptFiles.Count -eq 0) {
    Write-Error "No manuscript files found in: $ManuscriptDir"
    exit 1
}

Write-Host "Found $($ManuscriptFiles.Count) manuscript files" -ForegroundColor Cyan

# ── Combine all manuscript files into one temp file ─────────────────────────
$TempFile = [System.IO.Path]::GetTempFileName() + ".md"
$Encoding = New-Object System.Text.UTF8Encoding $false

$CombinedContent = @()
foreach ($File in $ManuscriptFiles) {
    $Content = [System.IO.File]::ReadAllText($File.FullName, $Encoding).Trim()
    $CombinedContent += $Content
}

$JoinedContent = $CombinedContent -join "`n`n---`n`n"
[System.IO.File]::WriteAllText($TempFile, $JoinedContent, $Encoding)

try {
    # ── Run Pandoc ───────────────────────────────────────────────────────────
    $PandocArgs = @(
        $TempFile,
        "-o", $OutputFile,
        "--metadata=title:$Title",
        "--metadata=author:$Author",
        "--toc"
    )

    Write-Host "Running pandoc..." -ForegroundColor Cyan
    & $PANDOC @PandocArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Pandoc failed with exit code $LASTEXITCODE"
        exit 1
    }

    Write-Host ""
    Write-Host "DOCX generation complete!" -ForegroundColor Green
    Write-Host "Output: $OutputFile" -ForegroundColor Cyan
}
finally {
    # Clean up temp file
    if (Test-Path $TempFile) {
        Remove-Item $TempFile -Force
    }
}
