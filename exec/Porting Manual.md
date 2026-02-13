1. 빌드 및 배포 가이드
이 프로젝트는 Next.js 기반의 프론트엔드 애플리케이션입니다.

Runtime: Node.js v20.9.0 이상 (Next.js 16 지원 사양 기준)

Framework: Next.js v16.1.6

Library: React v19.2.4, Jotai v2.17.0 (상태 관리)

Language: TypeScript v5.9.3

Styling: Tailwind CSS v4.1.18

IDE: Visual Studio Code 권장 (Biome 익스텐션 설치 권장)

빌드 및 실행 방법
Bash
# 1. 의존성 패키지 설치
npm install

# 2. 환경 변수 설정 (.env.local 파일 생성 필요)
# 필수 변수: NEXT_PUBLIC_API_URL

# 3. 프로젝트 빌드
npm run build

# 4. 서비스 실행
npm run dev
주요 환경 변수 및 설정 파일
환경 변수: .env.local 파일에 백엔드 API 서버 주소 및 API Key 정의 필요

설정 파일: package.json, package-lock.json, biome.json (코드 포맷팅용)