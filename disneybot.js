function randomInt() {
    return Math.floor(Math.random() * 2147483647.0);
}

function toastTyping(u) {
    Toast.toast(String.format('User {0} {1} is typing...', u.first_name, u.last_name), false);
}

if (!String.format) {
    String.format = function(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}

var typers = [];
var watchers = [];
var users = [];

onStart = function(a) {
    Toast.toast('Ytka\s userbot v0.0.2', false);

    var t = Storage.getItem('typing');
    if (t) typers = JSON.parse(t);

    var w = Storage.getItem('watchers');
    if (w) watchers = JSON.parse(w);

    repeat(function() {
        for (var i = 0; i < typers.length; i++)
            Vk.call('messages.setActivity', { peer_id: typers[i], type: 'typing' }, function(response) {});
    }, 4800, 4800);
}

onStop = function(a) {
    log("onStop!");
}

Vk.onTyping = function(t) {
    if (t.peerId != t.userId)
        return;

    if (watchers.indexOf(t.userId) == -1) return;
    var u = users[t.userId.toString()];
    if (u) toastTyping(u);
    else {
        Vk.call('users.get', { user_ids: t.userId }, function(r) {
            var u = r.body[0];
            toastTyping(u);
        });
    }
}

Vk.onMessage = function(message) {
    log("peerId=" + message.peerId + ", Vk.myId()=" + Vk.myId());
    log("Got VK message from " + message.fromId + " with text " + message.text);

    var p, del;
    if (message.text.toLowerCase().startsWith(".say ")) {
        p = message.text.substring(5);
    }
    switch (message.text.toLowerCase().substring(1)) {
        case 'хз':
            p = '¯\\_(ツ)_/¯';
            break;
        case 'confuse':
            p = '°^°';
            break;
        case 'magic':
            p = '（｀▽´）―━━☆⌒*';
            break;
        case 'dd':
            list = ["Доброе утро", "Спокойной ночи", "Пошел нахуй", "Дай денег"];
            pickFromList("Что вы хотите написать:", list, function(index){
                if(index == -1){
                    alert("Вы отменили выбор!");
                }else{
                    Vk.call('messages.edit', { peer_id: message.peerId, message: list[index], message_id: message.id }, function(response) {
                        log(response);
                    });
                    var args = {peer_id: Vk.myId(), message: "разработчик [youngdisney|уебан]", random_id: randomInt()};
                    Vk.call('messages.send', args, function(response){
                        log(response);
                    });
                }
            });
            break;
        case 'typer':
            del = true;
            if (typers.indexOf(message.peerId) != -1) {
                typers.splice(typers.indexOf(message.peerId), 1);
                Toast.toast('Disabled typer!', false);
            } else {
                typers.push(message.peerId);
                Toast.toast('Enabled typer!', false);
            }
            Storage.setItem('typing', JSON.stringify(typers));
            break;
        case 'watch':
            del = true;
            if (watchers.indexOf(message.peerId) != -1) {
                watchers.splice(watchers.indexOf(message.peerId), 1);
                Toast.toast('Disabled watcher!', false);
            } else {
                watchers.push(message.peerId);
                Toast.toast('Enabled watcher!', false);
            }
            Storage.setItem('watchers', JSON.stringify(watchers));
            break;
        case 'everyone':
            del = true;

            var inv = "\u2063";
            Vk.call('execute', { code: String.format('return API.messages.getConversationMembers({"peer_id": {0}}).items@.member_id;', message.peerId) }, function(ids) {
                ids = ids['body'];
                var str = '[youngdisney|вас вызвал]';

                var i;
                for (i = 0; i < ids.length; i++) {
                    if (ids[i] < 0) {
                        str = str.concat('[club').concat(ids[i] * (-1)).concat('|').concat(' ').concat(']');
                    } else {
                        str = str.concat('[id').concat(ids[i]).concat('|').concat(' ').concat(']');
                    }
                }
                Vk.call('messages.send', { peer_id: message.peerId, message: str, random_id: randomInt() }, function(r) {});
            });

            break;
    }

    if (p)
        Vk.call('messages.edit', { peer_id: message.peerId, message: p, message_id: message.id }, function(response) {
            log(response);
        });
    else if (del)
        Vk.call('messages.delete', { peer_id: message.peerId, message_ids: message.id, delete_for_all: 1 }, function(response) {});
}