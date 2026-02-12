# HTTPS SSL Setup Guide (using ZeroSSL & acme.sh)

이 문서는 `sslip.io` 와 `ZeroSSL`을 사용하여 백엔드 서버에 HTTPS를 적용하는 파이프라인을 설명합니다.

---

## 1. 개요
- **도메인:** `43.200.175.200.sslip.io` (IP를 도메인처럼 사용)
- **인증 기관:** ZeroSSL (Let's Encrypt 발급 제한 회피용)
- **도구:** `acme.sh`

---

## 2. 인증서 발급 프로세스

### 1단계: acme.sh 설치
```bash
curl https://get.acme.sh | sh -s email=your_email@example.com
```

### 2단계: ZeroSSL 인증서 발급 (Nginx 잠시 중단 필요)
```bash
sudo docker compose stop nginx
sudo /root/.acme.sh/acme.sh --issue -d 43.200.175.200.sslip.io --standalone --server zerossl
sudo docker compose start nginx
```

### 3단계: 인증서 관리 디렉토리 생성 및 복사
```bash
mkdir -p certs
sudo cp /root/.acme.sh/43.200.175.200.sslip.io_ecc/fullchain.cer certs/fullchain.pem
sudo cp /root/.acme.sh/43.200.175.200.sslip.io_ecc/43.200.175.200.sslip.io.key certs/privkey.pem
sudo chmod 644 certs/*
```

---

## 3. 설정 반영

### docker-compose.yml 수정
Nginx 서비스 섹션에 443 포트와 인증서 볼륨을 추가합니다.
```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./certs:/etc/nginx/certs:ro
```

### nginx/nginx.conf 수정
```nginx
server {
    listen 443 ssl;
    server_name 43.200.175.200.sslip.io;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # ... (생략) ...
}
```

---

## 4. 자동 갱신
`acme.sh`는 설치 시 자동으로 크론탭(Cron)에 등록되어 60일마다 인증서를 갱신합니다. 갱신 후 `certs` 폴더로 파일을 다시 복사하고 Nginx를 리로드하는 스크립트를 크론탭에 추가하는 것을 권장합니다.
