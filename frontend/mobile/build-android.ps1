$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
$env:GRADLE_USER_HOME = "D:\.gradle"

Write-Host "JAVA_HOME = $env:JAVA_HOME"
Write-Host "GRADLE_USER_HOME = $env:GRADLE_USER_HOME"
Write-Host "Free space C: $(([math]::Round((Get-PSDrive C).Free/1GB,2))) GB"
Write-Host "Free space D: $(([math]::Round((Get-PSDrive D).Free/1GB,2))) GB"

& "d:\webtest\SmartFood\frontend\mobile\android\gradlew.bat" `
  --project-dir "d:\webtest\SmartFood\frontend\mobile\android" `
  app:installDebug `
  -PreactNativeDevServerPort=8081
