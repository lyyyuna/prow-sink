import * as vscode from 'vscode';
import * as path from 'path';
import { ProwJobState } from './prowjobs';

export class ProwItem extends vscode.TreeItem {

    children: ProwItem[]|undefined;

    constructor(label: string, children?: ProwItem[], status: string='1') {
      super(
          label,
          children === undefined ? vscode.TreeItemCollapsibleState.None :
                                   vscode.TreeItemCollapsibleState.Expanded);
      this.children = children;
      
      switch (status) {
        case ProwJobState.SUCCESS: {
          this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'success.svg'),
            dark: path.join(__filename, '..', '..', 'media', 'success.svg')
          }
          break;
        }
        case ProwJobState.PENDING: {
          this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'pending.svg'),
            dark: path.join(__filename, '..', '..', 'media', 'pending.svg')
          }
          break;
        }
        case ProwJobState.FAILURE: {
          this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'failure.svg'),
            dark: path.join(__filename, '..', '..', 'media', 'failure.svg')
          }
          break;
        }
        case ProwJobState.ERROR: {
          this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'error.svg'),
            dark: path.join(__filename, '..', '..', 'media', 'error.svg')
          }
          break;
        }   
        case ProwJobState.ABORTED: {
          this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'aborted.svg'),
            dark: path.join(__filename, '..', '..', 'media', 'aborted.svg')
          }
          break;
        }       
      }
    }

    iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

}

export class ProwJobItem extends ProwItem {
  constructor(label: string, pj: any, status: string='1') {
    super(label, undefined, status)
    this.pj = pj;
  }
  pj: any;
  contextValue = 'prowjobitem';
}