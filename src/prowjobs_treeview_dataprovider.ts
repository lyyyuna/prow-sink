import * as vscode from 'vscode';
import { ProwjobItem } from './prowjobs_treeview_item';

export class ProwjobItemDataProvider implements vscode.TreeDataProvider<ProwjobItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ProwjobItem | undefined> = new vscode.EventEmitter<ProwjobItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ProwjobItem | undefined> = this._onDidChangeTreeData.event;

    private data: ProwjobItem[];

	constructor() {
        this.data = [];
	}

	refresh(): void {
        this.data = [new ProwjobItem('cars'), new ProwjobItem('bus'), ]
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: ProwjobItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
        return element;
      }
    
      getChildren(element?: ProwjobItem|undefined): vscode.ProviderResult<ProwjobItem[]> {
        if (element === undefined) {
          return this.data;
        }
        return element.children;
      }
}