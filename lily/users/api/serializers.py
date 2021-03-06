from django.conf import settings
from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers

from lily.api.nested.mixins import RelatedSerializerMixin
from lily.api.nested.serializers import WritableNestedSerializer
from lily.utils.api.serializers import RelatedWebhookSerializer

from ..models import Team, LilyUser
from lily.messaging.email.api.serializers import EmailAccountSerializer


class LilyUserSerializer(WritableNestedSerializer):
    """
    Serializer for the LilyUser model.
    """
    full_name = serializers.CharField(read_only=True)
    profile_picture = serializers.CharField(read_only=True)
    picture = serializers.ImageField(write_only=True, required=False)
    webhooks = RelatedWebhookSerializer(many=True, required=False, create_only=True)
    primary_email_account = EmailAccountSerializer(allow_null=True, required=False)

    class Meta:
        model = LilyUser
        fields = (
            'id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'primary_email_account',
            'position',
            'profile_picture',
            'picture',
            'is_active',
            'picture',
            'phone_number',
            'internal_number',
            'social_media',
            'language',
            # 'timezone',
            'teams',
            'webhooks',
        )

    def update(self, instance, validated_data):
        if self.instance.picture is validated_data.get('picture'):
            validated_data['picture'] = None

        return super(LilyUserSerializer, self).update(instance, validated_data)

    def validate_picture(self, value):
        if value and value.size > settings.MAX_AVATAR_SIZE:
            raise serializers.ValidationError(_('File too large. Size should not exceed 300 KB.'))

        return value


class RelatedLilyUserSerializer(RelatedSerializerMixin, LilyUserSerializer):

    class Meta:
        model = LilyUser

        fields = (
            'id',
            'first_name',
            'last_name',
            'full_name',
        )


class TeamSerializer(serializers.ModelSerializer):
    """
    Serializer for the Team model.
    """
    users = RelatedLilyUserSerializer(many=True, source='active_users')

    class Meta:
        model = Team
        fields = (
            'id',
            'name',
            'users',
        )


class RelatedTeamSerializer(RelatedSerializerMixin, TeamSerializer):
    class Meta:
        model = Team
        fields = (
            'id',
            'name',
        )


class LilyUserTokenSerializer(serializers.ModelSerializer):
    """
    Serializer for the LilyUser model.

    Only returns the user token
    """
    auth_token = serializers.CharField(read_only=True)

    class Meta:
        model = LilyUser
        fields = ('auth_token',)
