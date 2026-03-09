from rest_framework import generics
from .models import KarigarProfile
from .serializers import RegisterSerializer, KarigarProfileSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import RegisterSerializer
from rest_framework.permissions import AllowAny

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class KarigarListView(generics.ListAPIView):
    queryset = KarigarProfile.objects.all()
    serializer_class = KarigarProfileSerializer


class KarigarBySkillView(generics.ListAPIView):
    serializer_class = KarigarProfileSerializer

    def get_queryset(self):
        skill = self.kwargs["skill"]
        return KarigarProfile.objects.filter(skill__icontains=skill)
    
class LoginView(TokenObtainPairView):
    pass

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]