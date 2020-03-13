import * as vscode from 'vscode';
import * as path from 'path';

export class ProwjobItem extends vscode.TreeItem {

    children: ProwjobItem[]|undefined;

    constructor(label: string, children?: ProwjobItem[]) {
      super(
          label,
          children === undefined ? vscode.TreeItemCollapsibleState.None :
                                   vscode.TreeItemCollapsibleState.Expanded);
      this.children = children;
    }

}
