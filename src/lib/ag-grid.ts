import { bindable, inlineView } from 'aurelia-framework';
import * as ag from 'ag-grid';

@inlineView(`
    <template class="ag-fresh" style="align-self: stretch; flex-grow: 1; -ms-flex: 0 1 auto; flex: 1 1 100%;">
    </template>
`)
export class AgGridWrapper {
    @bindable columns;
    @bindable rows;
    // @bindable pageSize;
    gridOptions: Object;
    gridCreated: boolean;

    constructor() {
        // this.pageSize = 10;
        this.rows = [];
    }

    attached() {
        // let cols = this.columns.map(function(col) {
        //     return {
        //         headerName: col.headerName,
        //         field: col.field
        //     };
        // });

        // let gridOptions = {
        //     columnDefs: cols,
        //     rowData: this.rows,
        //     rowSelection: 'single',
        //     rowHeight: 25,
        //     pageSize: this.pageSize,
        //     enableColResize: true,
        //     enableSorting: true,
        //     enableFilter: true,
        //     debug: false
        // };

        // var eGridDiv = document.querySelector('#eGridDiv');
        // this.gridOptions = gridOptions;
        // new ag.Grid(eGridDiv, gridOptions);
        // this.gridOptions['api'].sizeColumnsToFit();

        this.gridCreated = true;
    }

    createGrid(elementId, gridOptions) {
        var eGridDiv = <HTMLElement>document.querySelector('#'+elementId);
        this.gridOptions = gridOptions;
        return new ag.Grid(eGridDiv, gridOptions);
    }

    rowsChanged(newValue, oldValue) {
        if (this.gridCreated && newValue && newValue.length) {
            this.gridOptions['api'].setRowData(newValue);
            this.gridOptions['api'].refreshView();
        }
    }
}