from channels import Group
from channels.auth import channel_session_user, channel_session_user_from_http


# Connected to websocket.connect
@channel_session_user_from_http
def ws_connect(message):
    # Subscribe to user group
    Group("user-%s" % message.user.id).add(message.reply_channel)
    # Subscribe to tenant group
    Group("tenant-%s" % message.user.tenant_id).add(message.reply_channel)
    # Subscribe to team groups
    for team in message.user.teams.all():
        Group("team-%s" % team.id).add(message.reply_channel)


# Connected to websocket.receive
@channel_session_user
def ws_message(message):
    Group("user-%s" % message.user.id).send({
        "text": message['text'],
    })


# Connected to websocket.disconnect
@channel_session_user
def ws_disconnect(message):
    Group("user-%s" % message.user.id).discard(message.reply_channel)
    Group("tenant-%s" % message.user.tenant_id).discard(message.reply_channel)
    for team in message.user.teams.all():
        Group("team-%s" % team.id).discard(message.reply_channel)
