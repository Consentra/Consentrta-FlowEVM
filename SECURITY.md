# 🔐 Security Policy

## 📅 Supported Versions

We actively maintain the latest version of **Consentra**. Please ensure you're using the most recent release for the latest security patches and features.

| Version | Supported          |
|---------|--------------------|
| latest  | ✅                 |
| old     | ❌                 |

---

## 🛡️ Reporting a Vulnerability

If you discover a security vulnerability in Consentra:

- **DO NOT** create a public issue or pull request
- **Please report it directly and privately** to our team via:

📨 **Telegram:** [@consentra](https://t.me/consentra)

We take all reports seriously and will work to resolve any issues as quickly as possible.

---

## 🏗️ Architecture-Level Protections

Consentra implements:

- **Smart Contract Audits** *(in progress / pending third-party audit)*
- **Access-Controlled Smart Contracts** for managing agent actions (e.g., Daisy)
- **Soulbound NFT-based Sybil resistance**
- **No single point of failure** in AI-agent execution logic
- **MetaMask-based secure authentication**

---

## 🔒 Secure Development Best Practices

We follow secure development practices:

- Code linting, static analysis, and peer review
- GitHub Actions for continuous integration and testing
- Dependency vulnerability scanning via `npm audit` and GitHub alerts
- Secrets management via GitHub Actions Encrypted Secrets

---

## 📃 License & Disclosure

This project is licensed under the MIT License.  
Please disclose vulnerabilities responsibly to avoid exploitation in production.

---

Thank you for helping make **Consentra** safer for everyone!
