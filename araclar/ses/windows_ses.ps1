<#
  windows_ses.ps1 - Windows'un yerlesik seslerinden wav uretir (internet ve anahtar yok).
  Tolga (tr-TR) OneCore sesidir: System.Speech GOREMEZ, WinRT (Windows.Media.SpeechSynthesis) gerekir.
  Zira (en-US) SAPI5 sesidir: System.Speech ile calisir.
  Kullanim: powershell -File windows_ses.ps1 -Motor tolga -MetinDosyasi metin.txt -Cikti cikti.wav
  Metni komut satirindan degil UTF-8 dosyadan ver (Turkce karakter bozulmasin).
#>
param(
  [ValidateSet('tolga','zira')][string]$Motor = 'tolga',
  [Parameter(Mandatory=$true)][string]$MetinDosyasi,
  [Parameter(Mandatory=$true)][string]$Cikti
)
$ErrorActionPreference = 'Stop'
$metin = [IO.File]::ReadAllText($MetinDosyasi, [Text.Encoding]::UTF8).Trim()

if ($Motor -eq 'zira') {
  Add-Type -AssemblyName System.Speech
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice('Microsoft Zira Desktop')
  $s.SetOutputToWaveFile($Cikti)
  $s.Speak($metin)
  $s.Dispose()
  return
}

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Bekle($islem, $tur) {
  $t = $asTask.MakeGenericMethod($tur).Invoke($null, @($islem))
  [void]$t.Wait(-1)
  $t.Result
}
[void][Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType=WindowsRuntime]
$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$ses = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -match 'Tolga' } | Select-Object -First 1
if (-not $ses) { throw 'Tolga sesi bulunamadi' }
$synth.Voice = $ses
$akis = Bekle ($synth.SynthesizeTextToStreamAsync($metin)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
$okuyucu = New-Object Windows.Storage.Streams.DataReader($akis.GetInputStreamAt(0))
[void](Bekle ($okuyucu.LoadAsync([uint32]$akis.Size)) ([uint32]))
$bayt = New-Object byte[] $akis.Size
$okuyucu.ReadBytes($bayt)
[IO.File]::WriteAllBytes($Cikti, $bayt)
