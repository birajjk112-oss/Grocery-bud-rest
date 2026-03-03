# views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import GroceryItemSerializer
from .models import GroceryItem


class GroceryListAPIView(APIView):
    """List all grocery items or create new item"""

    def get(self, request):
        items = GroceryItem.objects.all()
        serializer = GroceryItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GroceryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Item added successfully!',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroceryDetailAPIView(APIView):
    """Get, update or delete a grocery item"""

    def get_object(self, pk):
        try:
            return GroceryItem.objects.get(pk=pk)
        except GroceryItem.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = GroceryItemSerializer(item)
        return Response(serializer.data)

    def put(self, request, pk):
        """Full update"""
        item = self.get_object(pk)
        if not item:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = GroceryItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Item updated successfully!',
                'data': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """Partial update - can be used for toggling completed status"""
        item = self.get_object(pk)
        if not item:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = GroceryItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Item updated successfully!',
                'data': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        item.delete()
        return Response(
            {'message': 'Item deleted successfully!'},
            status=status.HTTP_204_NO_CONTENT
        )


class GroceryToggleAPIView(APIView):
    """Toggle completed status of a grocery item"""

    def post(self, request, pk):
        try:
            item = GroceryItem.objects.get(pk=pk)
            item.completed = not item.completed
            item.save()
            serializer = GroceryItemSerializer(item)
            return Response({
                'message': 'Item toggled successfully!',
                'data': serializer.data
            })
        except GroceryItem.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )