/**
 * 检测微信好友关系
 */

(() => {
    /**
     * 控件id
     */
    let ids;
    /**
     * 控件文本
     */
    let texts;
    let node_util;
    let db_util;
    /**
     * 悬浮窗
     */
    let window;
    /**
     * 好友的微信号
     */
    let last_we_chat_id;
    /**
     * 好友备注
     */
    let last_friend_remark;
    /**
     * 上一次点击的可见好友的位置
     */
    let last_index;
    /**
     * 执行步骤
     */
    let step;
    /**
     * 运行状态
     */
    let run;
    let language;

    /**
     * 点击通讯录
     */
    function clickContacts() {
        let nodes = id(ids["contacts"]).untilFind();
        for (let i = 0; i < nodes.size(); i++) {
            let node = nodes.get(i);
            if (texts["contacts"].match(node.text()) != null && node_util.backtrackClickNode(node)) {
                step = 1;
                break;
            }
        }
    }

    /**
     * 滚动好友列表
     */
    function scrollFriendList() {
        if (id(ids["friend_list"]).findOne().scrollForward()) {
            last_we_chat_id = "";
            last_friend_remark = "";
            last_index = 0;
            sleep(500);
        }
    }

    /**
     * 点击好友
     */
    function clickFriend() {
        let friend_remark_nodes = id(ids["friend_remark"]).untilFind();
        if (last_index >= friend_remark_nodes.size()) {
            if (id(ids["contacts_count"]).findOnce() == null) {
                scrollFriendList();
            } else {
                stopScript();
            }
        } else {
            let friend_remark_node = friend_remark_nodes.get(last_index);
            last_friend_remark = friend_remark_node.text();
            let repeat_friend_remark = last_index - 1 >= 0 && friend_remark_nodes.get(last_index - 1).text() == last_friend_remark;
            if (!db_util.ignoredFriendRemark(last_friend_remark) && (repeat_friend_remark || !db_util.hasFriendByFriendRemark(last_friend_remark)) && node_util.backtrackClickNode(friend_remark_node)) {
                step = 2;
            } else {
                step = 1;
            }
            last_index++;
        }
    }

    /**
     * 点击发送信息
     */
    function clickSendMessage() {
        let nodes = id(ids["send_message"]).untilFind();
        if (nodes.size() < 2 && node_util.backtrackClickNode(id(ids["back_to_friend_list"]).findOne())) {
            db_util.addFriend({we_chat_id: last_friend_remark, friend_remark: last_friend_remark, abnormal_message: '', selected: false, deleted: false, friend_type: db_util.IGNORED_FRIEND_TYPE});
            ui.run(() => {
                window.ignored_friends_text.setText(window.ignored_friends_text.text() + last_friend_remark + "\n");
                window.ignored_friends_text_scroll.scrollTo(0, window.ignored_friends_text.getHeight());
            });
            step = 1;
        } else {
            let we_chat_id = id(ids["we_chat_id"]).findOne().text();
            if (!db_util.hasFriendByWeChatID(we_chat_id)) {
                let friend_label_node = id(ids["friend_label"]).findOnce();
                let labels = friend_label_node != null ? friend_label_node.text().split(language["comma"]) : null;
                if (labels != null && labels.length != 0 && db_util.ignoredLabels(labels) && node_util.backtrackClickNode(id(ids["back_to_friend_list"]).findOne())) {
                    last_we_chat_id = we_chat_id;
                    db_util.addFriend({we_chat_id: we_chat_id, friend_remark: last_friend_remark, abnormal_message: '', selected: false, deleted: false, friend_type: db_util.NORMAL_FRIEND_TYPE});
                    step = 1;
                } else {
                    for (let i = 0; i < nodes.size(); i++) {
                        let node = nodes.get(i);
                        if (texts["send_message"].match(node.text()) != null && node_util.backtrackClickNode(node)) {
                            last_we_chat_id = we_chat_id;
                            step = 3;
                            break;
                        }
                    }
                }
            } else if (node_util.backtrackClickNode(id(ids["back_to_friend_list"]).findOne())) {
                step = 1;
            }
        }
    }

    /**
     * 点击更多功能
     */
    function clickMoreFunction() {
        if (node_util.backtrackClickNode(id(ids["more_function_by_transfer"]).findOne())) {
            step = 4;
        }
    }

    /**
     * 点击转账功能
     */
    function clickTransferFunction() {
        let nodes = id(ids["transfer_function"]).untilFind();
        for (let i = 0; i < nodes.size(); i++) {
            let node = nodes.get(i);
            if (texts["transfer"].match(node.text()) && node_util.backtrackClickNode(node)) {
                step = 5;
                break;
            }
        }
    }

    /**
     * 输入转账金额
     */
    function setTransferAmount() {
        let payee = id(ids["payee"]).findOne().text();
        if (payee != "" && payee != last_friend_remark) {
            db_util.addFriend({we_chat_id: last_we_chat_id, friend_remark: last_friend_remark, abnormal_message: '', selected: false, deleted: false, friend_type: db_util.NORMAL_FRIEND_TYPE});
            step = 8;
        } else if (id(ids["transfer_amount"]).findOne().setText("0.01")) {
            step = 6;
        }
    }

    /**
     * 点击确认转账
     */
    function clickConfirmTransfer() {
        if (node_util.backtrackClickNode(id(ids["confirm_transfer"]).enabled().findOne())) {
            step = 7;
        }
    }

    /**
     * 判断好友关系
     */
    function assertionFriend() {
        while (true) {
            if (node_util.backtrackClickNode(descMatches(texts["close"]).findOnce())) {
                db_util.addFriend({we_chat_id: last_we_chat_id, friend_remark: last_friend_remark, abnormal_message: '', selected: false, deleted: false, friend_type: db_util.NORMAL_FRIEND_TYPE});
                step = 8;
                break;
            }
            let abnormal_message_node = id(ids["abnormal_message"]).findOnce();
            let abnormal_message = abnormal_message_node != null ? abnormal_message_node.text() : null;
            if (abnormal_message != null && node_util.backtrackClickNode(id(ids["confirm_abnormal_message"]).findOnce())) {
                let selected = texts["blacklisted_message"].match(abnormal_message) != null || texts["deleted_message"].match(abnormal_message) != null;
                db_util.addFriend({we_chat_id: last_we_chat_id, friend_remark: last_friend_remark, abnormal_message: abnormal_message, selected: selected, deleted: false, friend_type: db_util.ABNORMAL_FRIEND_TYPE});
                step = 8;
                break;
            }
        }
    }

    /**
     * 返回聊天页面
     */
    function clickBackToChat() {
        if (node_util.backtrackClickNode(id(ids["back_to_chat"]).findOne())) {
            step = 9;
        }
    }

    /**
     * 返回聊天列表
     */
    function clickBackToChats() {
        if (node_util.backtrackClickNode(id(ids["back_to_chats"]).findOne())) {
            step = 0;
        }
    }

    /**
     * 监听音量下键按下，停止脚本运行
     */
    function keyDownListenerByVolumeDown() {
        threads.start(function () {
            // 启用按键监听
            events.observeKey();
            events.setKeyInterceptionEnabled("volume_down", true);
            // 监听减音量键按下
            events.onceKeyDown("volume_down", function () {
                stopScript();
            });
        });
    }

    /**
     * 停止脚本运行
     */
    function stopScript() {
        run = false;
        events.setKeyInterceptionEnabled("volume_down", false);
        events.removeAllKeyDownListeners("volume_down");
        toast(language["script_stopped"]);
        window.close();
        engines.execScriptFile("main.js");
        engines.myEngine().forceStop();
    }

    function main() {
        let config = JSON.parse(files.read("config/config.json"));
        if (launch(config["we_chat_package_name"])) {
            node_util = require("utils/node_util.js");
            db_util = require("utils/db_util.js");
            let app_util = require("utils/app_util.js");
            
            ids = app_util.weChatIds();
            texts = JSON.parse(files.read("config/text_id/text.json"));
    
            db_util.deleteAllIgnoredFriend();
            
            last_we_chat_id = "", last_friend_remark = "", last_index = 0, step = 0, run = true;
            keyDownListenerByVolumeDown();
            
            language = JSON.parse(files.read("config/languages/" + app_util.localLanguage() + ".json"));

            window = floaty.window(
                <vertical padding="8" bg="#000000">
                    <text textColor="#FFCC00" id="ignored_friends_title"/>
                    <scroll h="100" layout_weight="1" id="ignored_friends_text_scroll"><text textColor="#FFCC00" layout_gravity="top" id="ignored_friends_text"/></scroll>
                    <button id="stop_button" textColor="green" style="Widget.AppCompat.Button.Colored" textStyle="bold"/>
                </vertical>
            );
            window.ignored_friends_title.setText(language["ignored_friends_title"]);
            window.stop_button.setText(language["stop"]);
            window.setAdjustEnabled(true);
            window.stop_button.on("click", () => {
                stopScript();
            });
    
            while (run) {
                switch (step) {
                    case 0:
                        clickContacts();
                        break;
                    case 1:
                        clickFriend();
                        break;
                    case 2:
                        clickSendMessage();
                        break;
                    case 3:
                        clickMoreFunction();
                        break;
                    case 4:
                        clickTransferFunction();
                        break;
                    case 5:
                        setTransferAmount();
                        break;
                    case 6:
                        clickConfirmTransfer();
                        break;
                    case 7:
                        assertionFriend();
                        break;
                    case 8:
                        clickBackToChat();
                        break;
                    case 9:
                        clickBackToChats();
                        break;
                }
            }
        }
    }

    main();
})();
