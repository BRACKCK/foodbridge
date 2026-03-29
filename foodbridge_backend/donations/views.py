from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Donation
from .serializers import DonationSerializer

@api_view(['GET', 'POST'])
def donation_list(request):
    if request.method == 'GET':
        donations = Donation.objects.all()
        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = DonationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)