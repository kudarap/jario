var child,
    magicWord = 'jario',
    exec = require('child_process').exec,
    modem = require('modem').Modem(),
    device = process.argv[2];
    option = process.argv[3];

var main = function() {
    // checker
    if(!device) {
        err('device not specified');
    }

    cLog('Hello my name is ' + magicWord);

    cLog('connecting on device ' + device + ' ...');
    modem.open(device, function(){
        cLog('connected.');
	
        var msgCount = readMsgs();
	
        // listners
        var received = 'sms received';
        modem.on(received, function(msg) {
            cLog(received + '!'); 

            var response = null;

            // check valid msg
            if(checkMagicWord(msg.text)) {
		        var command = getCommand(msg.text);

                cLog('command: ' + command);

                // execute command
                bash(command, msg.sender);

                if(response == null) {
                    response = 'Done sir!';
                }
            } else {
                cLog('This one doesn\'t know me');
                sendMsg(msg.sender, 'You dont know me?');
            }
        
            // delete msg
            deleteMsg(msgCount - 1);
        });

        modem.on('memory full', function() {
    	    cLog('Memory is full. Im gonna delete some message');
    	    deleteMsg(1);
    	});
    });
}

var checkMagicWord = function(text) {
    return text.indexOf(magicWord) === -1 ? false : true;
}

var sendMsg = function(receiver, text) {
    modem.sms({
        receiver: receiver,
        text: escape(text),
        encoding: '7bit'},
        function(err, sent_ids) {
            if(err) {
                cLog('Error sending sms: ' + err);
            } else{
                cLog('Message sent successfully, here are reference ids: ' +  
                    sent_ids.join(','));
            }
        }
    );
}

var deleteMsg = function(index) {
    modem.deleteMessage(index, function() {
        cLog('Message deleted on index ' + index);
    });
}

var deleteAllMsgs = function(msgs) {
    for (var i = 0; i < msgs.length; i++) {
        deleteMsg(i);
    };

    cLog('All messages deleted');
}

var getCommand = function(text) {
    // split them by new line
    var chunks = text.split("\n");

    for (var i = 0; i < chunks.length; i++) {
        var segment = chunks[i];
        if(segment.indexOf(magicWord) !== -1) {
            return segment.replace(magicWord, '').trim();
        }
    };

    return 'Hey, say something!';
}

var readMsgs = function() {
    cLog('getting messages...');
    modem.getMessages(function(msg){
        cLog('msg count: ' + msg.length);

        if(option == 'reset') {
            deleteAllMsgs(msg);
        }

        return msg.length;
    });
}

var bash = function(command, sender) {
    var response;
    child = exec(command, function (error, stdout, stderr) {
        // get message
        response = stdout || stderr;
        
        cLog(response);

        sendMsg(sender, response);
    });
}

var err = function(msg) {
    cLog('Err: ' + msg);
    process.exit();
}

var cLog = function(msg) {
    console.log(msg);
}

// call main method
main();
