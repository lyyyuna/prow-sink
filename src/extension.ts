import * as vscode from 'vscode';

import { ProwjobItemDataProvider } from './prowjobs_treeview_dataprovider';    

export function activate(context: vscode.ExtensionContext) {

	let prowStatusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    prowStatusBarItem.text = 'Prow Notification OFF';
    prowStatusBarItem.command = 'extension.nofitifaction';
	prowStatusBarItem.show();

	const prowjobItemDataProvider = new ProwjobItemDataProvider();
	vscode.window.registerTreeDataProvider('prow-jobs', prowjobItemDataProvider);
	let disposable = vscode.commands.registerCommand('extension.refresh', () => prowjobItemDataProvider.refresh());
    let disposable2 = vscode.commands.registerCommand('extension.changeprview', () => prowjobItemDataProvider.changePresubmitJobView());
    let disposable3 = vscode.commands.registerCommand('extension.nofitifaction', () => prowjobItemDataProvider.switchNofication(prowStatusBarItem));



    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
	context.subscriptions.push(prowStatusBarItem);
}

export function deactivate() {}
