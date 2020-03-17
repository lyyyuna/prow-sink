import * as vscode from 'vscode';
import { ProwItem } from './prowjobs_treeview_item';
import { ProwJobs, ProwJobState } from './prowjobs';

export class ProwjobItemDataProvider implements vscode.TreeDataProvider<ProwItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ProwItem | undefined> = new vscode.EventEmitter<ProwItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ProwItem | undefined> = this._onDidChangeTreeData.event;
    
    private presubmitsrepo: Array<ProwItem> = new Array;
    private presubmitPRViewRepo: Array<ProwItem> = new Array;
    private postsubmitrepo: Array<ProwItem> = new Array;
    private periodicrepo: Array<ProwItem> = new Array;
    private viewOritention: boolean = true;
    private data: ProwItem[];
    private oldFocusedJobs: Map<string, any> = new Map;

    private timer: any;
    private timerFlag: boolean = true;

	constructor() {
        this.data = [];
        this.timer = null;
    }
    
    startQueringLoop() {
        if (this.timer == null) {
            this.timer = setInterval((function(self) {         
                return function() {   
                    self.refresh(); 
                }
            })(this), 20000); // 20 seconds
        }
    }

    stopQueryingLoop() {
        if (this.timer == null) {
            return;
        }
        clearInterval(this.timer);
        this.timer = null;
    }

	async refresh() {
        // reset
        this.presubmitsrepo = new Array;
        this.presubmitPRViewRepo = new Array;
        this.postsubmitrepo = new Array;
        this.periodicrepo = new Array;
        let prowJobsFromServer = new ProwJobs();
        let [presubmitTree, presubmitPRViewTree, postsubmitTree, periodicTree, focusedJobs] = await prowJobsFromServer.getLatestJobsStatus();

        // let presubmitsrepo: Array<ProwItem> = new Array;
        for (let r of Array.from(presubmitTree.keys()).sort()) {
            let repo: Map<string,any> = presubmitTree.get(r);
            let reposjob: Array<ProwItem> = new Array;
            for (let j of Array.from(repo.keys()).sort()) {
                let job: Map<string,any> = repo.get(j)
                let jobspr: Array<ProwItem> = new Array;
                for (let prnum of Array.from(job.keys()).sort().reverse()) {
                    let pj = job.get(prnum)
                    jobspr.push(new ProwItem(prnum + ' ' + pj.status?.state))
                }
                reposjob.push( new ProwItem(j, jobspr) );
            }
            this.presubmitsrepo.push( new ProwItem(r, reposjob) )
        }

        // another view oritention of presubmit jobs
        for (let r of Array.from(presubmitPRViewTree.keys()).sort()) {
            let repo: Map<string,any> = presubmitPRViewTree.get(r);
            let repospr: Array<ProwItem> = new Array;
            for (let p of Array.from(repo.keys()).sort().reverse()) {
                let pr: Map<string,any> = repo.get(p);
                let prsjob: Array<ProwItem> = new Array;
                for (let j of Array.from(pr.keys()).sort().reverse()) {
                    let pj = pr.get(j);
                    prsjob.push(new ProwItem(j + ' ' + pj.status?.state));
                }
                repospr.push( new ProwItem(p+'', prsjob) )
            }
            this.presubmitPRViewRepo.push( new ProwItem(r, repospr) )
        }

        // let postsubmitrepo: Array<ProwItem> = new Array;
        for (let r of postsubmitTree.keys()) {
            let repo: Map<string, any> = postsubmitTree.get(r);
            let reposjob: Array<ProwItem> = new Array;
            for (let j of repo.keys()) {
                let jobs: Array<any> = repo.get(j)
                let postsubmitjobs: Array<ProwItem> = new Array;
                for (let pj of jobs) {
                    let startTime = new Date(pj.status?.startTime).toLocaleString();
                    postsubmitjobs.push( new ProwItem( startTime + ' ' + pj.status?.state ) )
                }
                reposjob.push( new ProwItem( j, postsubmitjobs ) )
            }
            this.postsubmitrepo.push(new ProwItem( r, reposjob ))
        }

        // let periodicrepo: Array<ProwItem> = new Array;
        for (let r of periodicTree.keys()) {
            let repo: Map<string, any> = periodicTree.get(r);
            let reposjob: Array<ProwItem> = new Array;
            for (let j of repo.keys()) {
                let jobs: Array<any> = repo.get(j)
                let periodicjobs: Array<ProwItem> = new Array;
                for (let pj of jobs) {
                    let startTime = new Date(pj.status?.startTime).toLocaleString();
                    periodicjobs.push( new ProwItem( startTime + ' ' + pj.status?.state ) )
                }
                reposjob.push( new ProwItem( j, periodicjobs ) )
            }
            this.periodicrepo.push(new ProwItem( r, reposjob ))
        }

        if (this.viewOritention == false) {
            this.data = [new ProwItem('presubmit', this.presubmitPRViewRepo),
                        new ProwItem('periodic', this.periodicrepo),
                        new ProwItem('postsubmit', this.postsubmitrepo)]
        } else {
            this.data = [new ProwItem('presubmit', this.presubmitsrepo),
                        new ProwItem('periodic', this.periodicrepo),
                        new ProwItem('postsubmit', this.postsubmitrepo)]
        }

        // check if we need to trigger notifications
        let diffJobs = this.getDiffJobs(focusedJobs)
        // whether to notifify when refreshing...
        if (this.timerFlag == true) {
            this.notification(diffJobs);
        }

		this._onDidChangeTreeData.fire();
    }

    switchNofication(statusBar: any) {
        if (statusBar.text == 'Prow Notification ON') {
            statusBar.text = 'Prow Notification OFF'
            this.timerFlag = false;
        } else {
            statusBar.text = 'Prow Notification ON';
            this.timerFlag = true;
        }
    }

    notification(jobs: Array<any>) {
        for (let i=0; i<jobs.length; i++) {
            // show at least 10 messages every loop
            if (i > 10) {
                continue;
            }
            let pj = jobs[i];
            let state = pj.status?.state;
            let jobName = pj.spec?.job;
            let startTime = pj.status?.startTime
            let showTime = new Date(pj.status?.completionTime || startTime).toLocaleString();
            let jobType = pj.spec?.type;
            if (state != ProwJobState.PENDING) {
                let message: string;
                if (jobType == 'presubmit') {
                    message = state + ' ' + pj.spec?.refs?.pulls[0].number + ' ' + jobName + '\n ' + showTime;
                } else {
                    message = state + ' ' + jobName + '\n ' + showTime;
                }
                vscode.window.showInformationMessage( message );
            }
        }
    }
    
    getDiffJobs(focusedJobs: Map<string, any>): Array<any> {
        //let prowJobsFromServer = new ProwJobs();
        //let [presubmitTree, presubmitPRViewTree, postsubmitTree, periodicTree, focusedJobs] = await prowJobsFromServer.getLatestJobsStatus();

        // Do not alert for the first time when you open vscode
        if (Array.from(this.oldFocusedJobs).length == 0) {
            this.oldFocusedJobs = focusedJobs;
            return new Array;
        }

        let diffJobs: Array<any> = new Array;
        for (let j of focusedJobs.keys()) {
            if (this.oldFocusedJobs.has(j)) {
                continue
            }
            diffJobs.push(focusedJobs.get(j));
        }
        this.oldFocusedJobs = focusedJobs;
        return diffJobs;
    }

    changePresubmitJobView() {
        if (this.viewOritention == false) {
            this.viewOritention = true;
            this.data = [new ProwItem('presubmit', this.presubmitsrepo),
                        new ProwItem('periodic', this.periodicrepo),
                        new ProwItem('postsubmit', this.postsubmitrepo)]
        } else {
            this.viewOritention = false
            this.data = [new ProwItem('presubmit', this.presubmitPRViewRepo),
                        new ProwItem('periodic', this.periodicrepo),
                        new ProwItem('postsubmit', this.postsubmitrepo)]
        }
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