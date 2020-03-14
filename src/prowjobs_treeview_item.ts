import * as vscode from 'vscode';
import * as path from 'path';

export class ProwItem extends vscode.TreeItem {

    children: ProwItem[]|undefined;

    constructor(label: string, children?: ProwItem[]) {
      super(
          label,
          children === undefined ? vscode.TreeItemCollapsibleState.None :
                                   vscode.TreeItemCollapsibleState.Expanded);
      this.children = children;
    }

    iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

}
