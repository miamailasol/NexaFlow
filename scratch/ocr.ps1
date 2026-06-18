[CmdletBinding()]
param()

# Ensure we can load WinRT types
$OcrEngineType = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]
$SoftwareBitmapType = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$FileRandomAccessStreamType = [Windows.Storage.Streams.FileRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
$BitmapDecoderType = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]

# Find all PNG files in the screen directory
$screenDir = "e:\Airdrop ARC\Agora Hackathon - 50k USDC\NexaFlow\screen"
$files = Get-ChildItem -Path $screenDir -Filter "*.png"

# Load default OcrEngine
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {
    Write-Error "Could not create OCR Engine."
    exit 1
}

function Get-WinRTResult($AsyncOperation) {
    while ($AsyncOperation.Status -eq 'Started') {
        Start-Sleep -Milliseconds 10
    }
    if ($AsyncOperation.Status -eq 'Error') {
        throw $AsyncOperation.ErrorCode
    }
    return $AsyncOperation.GetResults()
}

foreach ($file in $files) {
    Write-Host "--- Scanning $($file.Name) ---" -ForegroundColor Cyan
    try {
        # Open file
        $storageFile = Get-WinRTResult ([Windows.Storage.StorageFile]::GetFileFromPathAsync($file.FullName))
        
        # Open stream
        $stream = Get-WinRTResult ($storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read))
        
        # Decode bitmap
        $decoder = Get-WinRTResult ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream))
        
        # Get software bitmap
        $bitmap = Get-WinRTResult ($decoder.GetSoftwareBitmapAsync())
        
        # Recognize text
        $result = Get-WinRTResult ($engine.RecognizeAsync($bitmap))
        
        Write-Host "Recognized Text:" -ForegroundColor Yellow
        Write-Host $result.Text
    } catch {
        Write-Error "Failed to recognize text for $($file.Name): $_"
    }
    Write-Host ""
}
