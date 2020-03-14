import * as vscode from 'vscode';
import { ProwItem } from './prowjobs_treeview_item';
import { ProwJobs } from './prowjobs';

export class ProwjobItemDataProvider implements vscode.TreeDataProvider<ProwItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ProwItem | undefined> = new vscode.EventEmitter<ProwItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ProwItem | undefined> = this._onDidChangeTreeData.event;

    private data: ProwItem[];

	constructor() {
        this.data = [];
	}

	async refresh() {
        let prowJobsFromServer = new ProwJobs();
        let [presubmitTree, postsubmitTree, periodicTree] = await prowJobsFromServer.getLatestJobsStatus();

        let presubmitsrepo: Array<ProwItem> = new Array;
        for (let r of presubmitTree.keys()) {
            let repo: Map<string,any> = presubmitTree.get(r);
            let reposjob: Array<ProwItem> = new Array;
            for (let j of repo.keys()) {
                let job: Map<string,any> = repo.get(j)
                let jobspr: Array<ProwItem> = new Array;
                for (let prnum of job.keys()) {
                    let pj = job.get(prnum)
                    jobspr.push(new ProwItem(prnum + ' ' + pj.status?.state))
                }
                reposjob.push( new ProwItem(j, jobspr) );
            }
            presubmitsrepo.push( new ProwItem(r, reposjob) )
        }

        let postsubmitrepo: Array<ProwItem> = new Array;
        for (let r of postsubmitTree.keys()) {
            let repo: Map<string, any> = postsubmitTree.get(r);
            let reposjob: Array<ProwItem> = new Array;
            for (let j of repo.keys()) {
                let jobs: Array<any> = repo.get(j)
                let postsubmitjobs: Array<ProwItem> = new Array;
                for (let pj of jobs) {
                    postsubmitjobs.push( new ProwItem( pj.status?.startTime + ' ' + pj.status?.state ) )
                }
                reposjob.push( new ProwItem( j, postsubmitjobs ) )
            }
            postsubmitrepo.push(new ProwItem( r, reposjob ))
        }

        let periodicrepo: Array<ProwItem> = new Array;
        for (let r of periodicTree.keys()) {
            let repo: Map<string, any> = periodicTree.get(r);
            let reposjob: Array<ProwItem> = new Array;
            for (let j of repo.keys()) {
                let jobs: Array<any> = repo.get(j)
                let periodicjobs: Array<ProwItem> = new Array;
                for (let pj of jobs) {
                    periodicjobs.push( new ProwItem( pj.status?.startTime + ' ' + pj.status?.state ) )
                }
                reposjob.push( new ProwItem( j, periodicjobs ) )
            }
            periodicrepo.push(new ProwItem( r, reposjob ))
        }

        this.data = [new ProwItem('presubmit', presubmitsrepo),
                    new ProwItem('periodic', periodicrepo),
                    new ProwItem('postsubmit', postsubmitrepo)]
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: ProwItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
        return element;
    }
    
    getChildren(element?: ProwItem|undefined): vscode.ProviderResult<ProwItem[]> {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
}