from django.urls import path
from .views import MainView, SubView

urlpatterns = [
    path('main/', MainView.as_view(), name='home_main'),
    path('sub/', SubView.as_view(), name='home_sub'),
]
