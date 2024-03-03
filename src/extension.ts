// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as d3 from 'd3';

interface ContentChanges {
	id: number;
	changes: readonly vscode.TextDocumentContentChangeEvent[];
}

class TreeNode<T> {
    value: T;
	parent: TreeNode<T>;
    children: TreeNode<T>[];
	
    constructor(value: T, parent?: TreeNode<T>) {
        this.value = value;
        this.children = [];

		if (parent) {
			this.parent = parent;
		} else {
			// If the node doesn't have a parent then point to itself.
			this.parent = this;
		}
    }

    addChild(node: TreeNode<T>): TreeNode<T> {
        this.children.push(node);
		return node;
    }
}

let id=0;

// TODO: file->undotree
//		 each file should have its own undoTree
let root:TreeNode<ContentChanges> = new TreeNode({id: id, changes: []});;
let cur:TreeNode<ContentChanges> = root;


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "undo-tree" is now active!');

	let moveBelow = vscode.commands.registerCommand('undo-tree.goDown', () => {
        // Code to execute when the command is triggered
        // vscode.window.showInformationMessage('Key pressed!');
    });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('undo-tree.captureUndo', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
		// TODO: read undoTree from disk

		vscode.workspace.onDidChangeTextDocument((event) => {
			// Check if the changes are related to user actions (e.g., undo)
			

			/* 
				* <event>: TextDocumentChangeEvent
				* Has 3 attributes:
					1. contentChanges: contains the changes
						- could we restore the state using this changes?
					2. document: file in question
						- should be able to index into the hashmap of undoTrees
					3. reason: undo(1) and redo(2)
						- Only present if the changes come from undo or redo
				* reference: https://code.visualstudio.com/api/references/vscode-api#TextDocumentChangeEvent
			*/
			
			if (event.reason == vscode.TextDocumentChangeReason.Undo) {
				let newNode = new TreeNode<ContentChanges>({id: ++id, changes:event.contentChanges}, cur)
				cur.addChild(newNode);
				cur = newNode;
				console.log("undo");
				console.log(cur);
			} else if (event.reason == vscode.TextDocumentChangeReason.Redo) {
				cur = cur.parent;
				console.log("redo");
				console.log(cur);
			}
		});
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.commands.registerCommand('undo-tree.showTree', () => {
		  // Create and show panel
			const panel = vscode.window.createWebviewPanel(
			'undo-tree',
			'Undo Tree',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		  );
		  // And set its HTML content
		  panel.webview.html = `<!DOCTYPE html>
		  <html lang="en">
		  <head>
			  <meta charset="UTF-8">
			  <meta name="viewport" content="width=device-width, initial-scale=1.0">
			  <title>D3 Hierarchical Tree Example</title>
			  <!-- Include D3.js library -->
			  <script src="https://d3js.org/d3.v7.min.js"></script>
			  <style>
				  /* Define styles for the nodes and links */
				  .node {
					  fill: #ccc;
					  stroke: #333;
					  stroke-width: 2px;
				  }
		  
				  .link {
					  fill: none;
					  stroke: #555;
					  stroke-width: 1.5px;
				  }
			  </style>
		  </head>
		  <body>
		  
			  <!-- Create an SVG container for the tree -->
			  <svg width="2000" height="2000"></svg>
		  
			  <script>
				  // Sample hierarchical tree data
				  const treeData = {
					  name: 'Root',
					  children: [
						  {
							  name: 'Node 1',
							  children: [
								  { name: 'Node 1.1' },
								  { name: 'Node 1.2' }
							  ]
						  },
						  {
							  name: 'Node 2',
							  children: [
								  { name: 'Node 2.1' },
								  {
									  name: 'Node 2.2',
									  children: [
										  { name: 'Node 2.2.1' },
										  { name: 'Node 2.2.2' }
									  ]
								  }
							  ]
						  }
					  ]
				  };
		  
				  // Create a D3 tree layout
				  const treeLayout = d3.tree().size([1000, 1000]);
		  
				  // Append an SVG group to the body
				  const svg = d3.select('svg');
				  const g = svg.append('g').attr('transform', 'translate(1000,50) rotate(90)')
		  
				  // Create a hierarchical structure from the data
				  const root = d3.hierarchy(treeData);
				  // tree.rotate([0, 90]);
				  const tree = treeLayout(root);
		  
				  // Draw links
				  const link = g.selectAll('.link')
					  .data(tree.links())
					  .enter().append('path')
					  .attr('class', 'link')
					  .attr('d', d3.linkHorizontal()
						  .x(d => d.y)
						  .y(d => d.x));
		  
				  // Draw nodes
				  const node = g.selectAll('.node')
					  .data(tree.descendants())
					  .enter().append('circle')
					  .attr('class', 'node')
					  .attr('r', 10)
					  .attr('cx', d => d.y)
					  .attr('cy', d => d.x);
		  
			  </script>
		  </body>
		  </html>
		  
		  `;
		})
	  );

}

// This method is called when your extension is deactivated
export function deactivate() {}
