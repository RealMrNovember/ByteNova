# Resend DNS Kayitlari — cicibyte.com (Cloudflare)

## DKIM (TXT)
- Name: resend._domainkey
- Tip: TXT
- Deger: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDXyg9sG1PdyTLQZc2IVjgSpJMvNYIVX3eyWFOTr6RmnRX8ZK3Gxgoqh6ZRLi2rUOvr7RGtFv9ad1dr7fyQ48Hmq+EZvvquMMt6WxcNsNKz0nw87lErmLPmExmP2vsx4USF8C7pMattzsclRbHlbvJ/VRsh44Qn8X71uMj6ljmPdQIDAQAB
- Proxy: KAPALI (DNS only)

## SPF (MX)
- Name: send
- Tip: MX
- Deger: feedback-smtp.us-east-1.amazonses.com
- Oncelik: 10
- Proxy: KAPALI (DNS only)

## SPF (TXT)
- Name: send
- Tip: TXT
- Deger: v=spf1 include:amazonses.com ~all
- Proxy: KAPALI (DNS only)

