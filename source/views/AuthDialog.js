/*jslint sloppy: true, browser: true */
/*global enyo*/

enyo.kind({
	name: "moboreader.AuthDialog",
	kind: "enyo.FittableRows",
	classes: "enyo-fill",
	published: {
		callback: "",
		redirectURL: "",
		serviceName: "",
		cancelable: false
	},
	bindings: [
		{from: "$.webView.showing", to: "$.pasteBtn.showing" }
	],
	events: {
		onHideAuth: ""
	},
	components: [
		{
			kind: "onyx.Toolbar",
			style: "text-align: center;",
			components: [
				{name: "message", content: "Preparing login"},
				{kind: "onyx.Button", name: "pasteBtn", content: "Paste", ontap: "pasteIntoWebview", style: "float: right;" }
			]
		},
		{
			name: "spinner",
			style: "display: block; margin: 10px auto;",
			kind: "onyx.Spinner"
		},
		{
			classes: "enyo-fill",
			style: "display: block; margin: 10px auto;",
			fit: true,
			kind: "IFrameWebView",
			name: "webView",
			onPageTitleChanged: "processTitleChange",
			showing: false
		},
		{
			style: "margin: 10px auto;",
			kind: "onyx.Button",
			content: "Retry",
			name: "retryBtn",
			ontap: "doRetry",
			showing: false
		},
		{
			kind: "enyo.Signals",
			onbackbutton: "handleBackGesture",
			onNeedShowAuth: "prepareAuthDialog",
			onAuthURL: "setUrl",
			onAuthOk: "resultOk"
		}
	],

	prepareAuthDialog: function (inSender, inEvent) {
		/*jslint unparam:true*/
		this.$.retryBtn.hide();
		this.$.spinner.show();
		this.fired = false;

		this.setCancelable(!!inEvent.cancelable);
		this.redirectURL = inEvent.redirectURL;
		this.serviceName = inEvent.serviceName;
		this.callback = inEvent.callback;
	},
	setUrl: function (inSender, inEvent) {
		/*jslint unparam:true*/
		if (inEvent.url) {
			this.$.webView.show();
			this.$.spinner.hide();
			this.url = inEvent.url;
			this.$.message.setContent("Please log in to " + this.serviceName + " below.");
			this.$.webView.setUrl(this.url);
		}
	},
	processTitleChange: function (inSender, inEvent) {
		/*jslint unparam:true*/
		var title = inEvent.title, result;
		if (this.fired) {
			this.log("Already authorizing, abort.");
			return;
		}

		if (typeof title === "string" && title.indexOf("token:") === 0) {
			result = this.callback(inEvent.title);
			if (result !== undefined) {
				if (result === "invalid") {
					return;
				}
				if (result) {
					this.resultOk();
				} else {
					this.resultFail({}, {});
				}
			}
			this.$.webView.hideAll();
			this.$.spinner.show();
			this.fired = true;
		} else {
			this.log("Wrong title: ", title);
		}
	},
	resultOk: function (inSender, inEvent) {
		/*jslint unparam:true*/
		var username = inEvent ? inEvent.username : false;
		this.$.message.setContent("Successfully logged in" + (username ? (" as " + username + ".") : "."));
		setTimeout(function () { enyo.Signals.send("onHideAuth"); }, 2000);
	},
	resultFail: function (inSender, inEvent) {
		/*jslint unparam:true*/
		this.$.message.setContent("Failed to log in. Please try again later.");
		this.$.webView.hideAll();
		this.$.retryBtn.show();
		this.retryFunc = inEvent.callback;
	},
	doRetry: function () {
		if (this.retryFunc && typeof this.retryFunc === "function") {
			this.retryFunc();
			this.$.webView.hideAll();
			this.$.spinner.show();
		} else {
			this.$.retryBtn.hide();
			if (this.url) {
				this.$.webView.show();
				this.$.webView.setUrl(this.url);
			}
			this.fired = false;
			this.$.message.setContent("Please log in to " + this.serviceName + " below.");
		}
	},
	handleBackGesture: function () {
		if (this.cancelable) {
			enyo.Signals.send("onHideAuth");
		}
	},
	pasteIntoWebview: function () {
		this.$.webView.pasteIntoWebview();
	}
});
