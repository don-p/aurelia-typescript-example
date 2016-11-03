import {LogManager} from 'aurelia-framework';
import {Logger} from 'aurelia-logging';
import {IFilter, IFilterParams, IDoesFilterPassParams} from 'ag-grid/main';
import * as debounce from 'debounce';

export class TextSearchFilter implements IFilter {

    public static CONTAINS = 'contains';//1;
    private filterParams: IFilterParams;

    private filterText: string;
    private filterType: string;

    private applyActive: boolean;
    private newRowsActionKeep: boolean;

    private eGui: HTMLElement;
    private eFilterTextField: HTMLInputElement;
    private eTypeSelect: HTMLSelectElement;
    private eApplyButton: HTMLButtonElement;

    private logger: Logger;

    constructor() {
        this.logger = LogManager.getLogger(this.constructor.name);
    }


    public init(params: IFilterParams): void {
        this.filterParams = params;
        this.newRowsActionKeep = (<any>params).newRowsAction === 'keep';

        this.filterText = null;
        this.filterType = TextSearchFilter.CONTAINS;

        this.createGui();
    }

    public onNewRowsLoaded() {
        if (!this.newRowsActionKeep) {
            this.setFilter(null);
        }
    }

    public afterGuiAttached() {
        this.eFilterTextField.focus();
    }

    public doesFilterPass(params: IDoesFilterPassParams) {
        if (!this.filterText) {
            return true;
        }
        var value = this.filterParams.valueGetter(params.node);
        if (!value) {
            return false;
        }
        var valueLowerCase = value.toString().toLowerCase();
        switch (this.filterType) {
            case TextSearchFilter.CONTAINS:
                return valueLowerCase.indexOf(this.filterText) >= 0;
            default:
                // should never happen
                console.warn('invalid filter type ' + this.filterType);
                return false;
        }
    }

    public getGui() {
        return this.eGui;
    }

    public isFilterActive() {
        return (this.filterText !== null && this.filterText !== '');
    }

    private createTemplate() {

        return `<div>
                    <div>
                        Filter:
                    </div>
                    <div>
                        <input class="ag-filter-filter" id="filterText" type="text" placeholder="Filter..."/>
                    </div>
                </div>`;
    }

    private createGui() {
        let me = this;
        this.eGui = this.loadTemplate(this.createTemplate());
        this.eFilterTextField = <HTMLInputElement> this.eGui.querySelector("#filterText");
        // this.eFilterTextField.addEventListener("changed", this.onFilterChanged.bind(this));

        // Debounce the user keyboard events, to avoid multiple http calls.
        this.addChangeListener(this.eFilterTextField, 
            debounce.default(this.onFilterChanged.bind(this), 500));
    }

    private loadTemplate(template: string): HTMLElement {
        var tempDiv = document.createElement("div");
        tempDiv.innerHTML = template;
        return <HTMLElement> tempDiv.firstChild;
    }

        //adds all type of change listeners to an element, intended to be a text field
    private addChangeListener(element: HTMLElement, listener: EventListener) {
        element.addEventListener("input", listener);
        element.addEventListener("paste", listener);
        element.addEventListener("input", listener);
        // IE doesn't fire changed for special keys (eg delete, backspace), so need to
        // listen for this further ones
        // element.addEventListener("keydown", listener);
        // element.addEventListener("keyup", listener);
    }



    private onFilterChanged() {
        this.logger.debug('--- Input chenged, runnung search.');
        var filterText = this.eFilterTextField.value;
        if (filterText && filterText.trim() === '') {
            filterText = null;
        }
        var newFilterText: string;
        if (filterText!==null && filterText!==undefined) {
            newFilterText = filterText.toLowerCase();
        } else {
            newFilterText = null;
        }
        if (this.filterText !== newFilterText) {
            this.filterText = newFilterText;
            this.filterChanged();
        }
    }

    private filterChanged() {
        this.filterParams.filterModifiedCallback();
        if (!this.applyActive) {
            this.filterParams.filterChangedCallback();
        }
    }

    public setFilter(filter: string): void {
        filter = filter;

        if (filter) {
            this.filterText = filter.toLowerCase();
            this.eFilterTextField.value = filter;
        } else {
            this.filterText = null;
            this.eFilterTextField.value = null;
        }
    }

    public getFilter(): string {
        return this.filterText;
    }

    public getModel(): any {
        if (this.isFilterActive()) {
            return {
                type: this.filterType,
                filter: this.filterText
            };
        } else {
            return null;
        }
    }

    public setModel(model: any): void {
        if (model) {
            this.setFilter(model.filter);
        } else {
            this.setFilter(null);
        }
    }

}
