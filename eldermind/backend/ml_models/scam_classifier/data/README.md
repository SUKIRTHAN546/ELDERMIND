# Scam Classifier Training Data

**Owner:** Sudharsan

## Format

Create a file `scam_examples.csv` in this folder with the following columns:

```
text,label
"You have won a lottery of 10 lakh rupees. Call this number now.",1
"How are you feeling today?",0
```

- `label = 1` → scam message
- `label = 0` → safe message

## Target

Minimum **300 examples** (at least 100 scam, 200 safe).

## Example Scam Categories to Cover

- Lottery / prize fraud ("You have won...")
- Bank impersonation ("Your account will be blocked...")
- Government impersonation ("KYC update required...")
- Fake offers ("Free medicine / insurance...")
- Urgency pressure ("Call immediately or lose benefits...")
- Personal info phishing ("Send your Aadhaar / OTP...")

## Note

This file (`scam_examples.csv`) **should** be committed to Git — it's training data, not a secret.
The trained model files (`*.pkl`, `*.joblib`) are gitignored — share them via Google Drive.
