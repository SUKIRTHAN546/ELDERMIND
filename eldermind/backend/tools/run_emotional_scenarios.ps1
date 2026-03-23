param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [Parameter(Mandatory = $true)][string]$Phone,
    [Parameter(Mandatory = $true)][string]$Password,
    [string]$MemoryContext = "[family] Son named Karthik lives in Bangalore"
)

$ErrorActionPreference = "Stop"

function Test-NoTamilChars {
    param([string]$Text)
    if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
    # Tamil Unicode range: 0B80-0BFF
    return -not ($Text -match "[\u0B80-\u0BFF]")
}

function Test-ContainsAny {
    param(
        [string]$Text,
        [string[]]$Words
    )
    if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
    foreach ($w in $Words) {
        if ($Text.ToLower().Contains($w.ToLower())) { return $true }
    }
    return $false
}

Write-Host "Logging in to $BaseUrl ..."
$loginBody = @{
    phone    = $Phone
    password = $Password
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $login.access_token
$userId = $login.user_id

if (-not $token) { throw "Login failed: access_token missing." }
if (-not $userId) { throw "Login failed: user_id missing." }

$headers = @{ Authorization = "Bearer $token" }

$scenarios = @(
    @{
        Name = "Loneliness"
        Message = "I feel very lonely today, nobody calls me"
        ExpectWords = @("sorry", "hear", "with you", "talk")
    },
    @{
        Name = "Grief"
        Message = "I miss my husband so much today"
        ExpectWords = @("sorry", "miss", "memory", "with you")
    },
    @{
        Name = "Health Worry"
        Message = "I forgot my blood pressure tablet this morning"
        ExpectWords = @("doctor", "family", "check")
    },
    @{
        Name = "Confusion"
        Message = "Beta, who are you again?"
        ExpectWords = @("eldermind", "here", "help")
    },
    @{
        Name = "Celebration"
        Message = "My grandson got first rank in his class!"
        ExpectWords = @("wonderful", "congrat", "happy", "proud")
    },
    @{
        Name = "Scam Risk"
        Message = "Someone called and said I won 10 lakh rupees"
        ExpectWords = @("careful", "check", "family", "verify")
    },
    @{
        Name = "Codemix"
        Message = "Amma sollunga, naan eppadi irukkeno"
        ExpectWords = @("how", "feeling", "dear", "here")
    }
)

$results = @()

foreach ($s in $scenarios) {
    Write-Host ""
    Write-Host "Running: $($s.Name)"
    $chatBody = @{
        user_id = $userId
        message = $s.Message
        memory_context = $MemoryContext
    } | ConvertTo-Json

    $resp = Invoke-RestMethod -Uri "$BaseUrl/chat/" -Method Post -Headers $headers -ContentType "application/json" -Body $chatBody
    $reply = [string]$resp.reply

    $nonEmpty = -not [string]::IsNullOrWhiteSpace($reply)
    $englishCheck = Test-NoTamilChars -Text $reply
    $intentCheck = Test-ContainsAny -Text $reply -Words $s.ExpectWords

    $status = if ($nonEmpty -and $englishCheck -and $intentCheck) { "PASS" } else { "REVIEW" }

    $results += [pscustomobject]@{
        Scenario = $s.Name
        Status = $status
        NonEmpty = $nonEmpty
        EnglishOnly = $englishCheck
        IntentWords = $intentCheck
        Reply = $reply
    }

    Write-Host "Status: $status"
    Write-Host "Reply: $reply"
}

Write-Host ""
Write-Host "=== Summary ==="
$results | Select-Object Scenario, Status, NonEmpty, EnglishOnly, IntentWords | Format-Table -AutoSize

$outPath = Join-Path (Get-Location) "tanisha_emotional_test_run.json"
$results | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8
Write-Host ""
Write-Host "Saved detailed results to: $outPath"
