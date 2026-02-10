from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # DRF의 기본 예외 처리를 먼저 호출합니다.
    response = exception_handler(exc, context)

    if response is not None:
        custom_res = {
            'status': 'error',
            'code': response.status_code,
            'message': '',
            'details': response.data
        }

        if response.status_code == 401:
            custom_res['message'] = '인증에 실패했습니다. 로그인이 필요하거나 토큰이 만료되었습니다.'
        elif response.status_code == 403:
            custom_res['message'] = '이 작업을 수행할 권한이 없습니다.'
        elif response.status_code == 404:
            custom_res['message'] = '요청하신 리소스를 찾을 수 없습니다.'
        elif response.status_code == 400:
            custom_res['message'] = '잘못된 요청입니다. 입력값을 확인해주세요.'
        else:
            custom_res['message'] = '서버 내부 오류가 발생했습니다.'

        response.data = custom_res

    return response
