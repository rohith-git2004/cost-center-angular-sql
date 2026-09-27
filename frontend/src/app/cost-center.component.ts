import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CostCenterService,
  CostCenter,
  CompanyRow,
  LookupItem
} from './cost-center.service';

@Component({
  selector: 'app-cost-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cost-center.component.html'
})
export class CostCenterComponent implements OnInit {

  private api = inject(CostCenterService);

  mode: 'form' | 'list' = 'form';

  editingId: number | null = null;

  loading = false;
  saving = false;

  message = '';
  error = '';

  centers: CostCenter[] = [];

  activation: LookupItem[] = [];

  companyOptions: LookupItem[] = [];

  form: CostCenter = this.blank();

  /*
   * TRUE  = show the initial ... row
   * FALSE = show normal company input rows
   */
  companyLookupMode = true;

  ngOnInit() {

    this.loadList();

    this.api.activation().subscribe({
      next: data => {
        this.activation = data;
      },
      error: err => {
        console.error(
          'Activation loading error:',
          err
        );
      }
    });

    this.api.companies().subscribe({
      next: data => {
        this.companyOptions = data;
      },
      error: err => {
        console.error(
          'Company loading error:',
          err
        );
      }
    });
  }


  blank(): CostCenter {

    return {
      sysId: undefined,
      code: '',
      name: '',
      activationDeactivationYn: 'N',
      activationDeactivationSysId: null,
      activationDeactivationCode: '',
      activationDeactivationName: '',
      companies: [
        this.blankCompany()
      ]
    };
  }


  blankCompany(): CompanyRow {

    return {
      companySysId: 0,
      companyCode: '',
      companyName: ''
    };
  }


  loadList() {

    this.loading = true;

    this.api.list().subscribe({

      next: data => {

        this.centers = data;

        this.loading = false;
      },

      error: err => {

        console.error(err);

        this.error =
          err?.error?.message ||
          'Unable to load data';

        this.loading = false;
      }
    });
  }


  newForm() {

    this.form = this.blank();

    this.editingId = null;

    this.companyLookupMode = true;

    this.mode = 'form';

    this.message = '';

    this.error = '';
  }


  edit(c: CostCenter) {

    this.form =
      JSON.parse(
        JSON.stringify(c)
      );

    if (!this.form.companies?.length) {

      this.form.companies = [
        this.blankCompany()
      ];
    }

    this.editingId =
      c.sysId || null;

    /*
     * When editing an existing record,
     * show the normal company rows.
     */
    this.companyLookupMode = false;

    this.mode = 'form';

    this.message = '';

    this.error = '';
  }


  showList() {

    this.mode = 'list';

    this.message = '';

    this.error = '';

    this.loadList();
  }


  toggleActivation(
    checked: boolean
  ) {

    this.form.activationDeactivationYn =
      checked ? 'Y' : 'N';
  }


  getActivationById(
    id: number | null
  ): LookupItem | undefined {

    return this.activation.find(
      item => item.sysId === id
    );
  }


  selectActivation(
    item: LookupItem | undefined
  ) {

    if (!item) {

      this.clearActivation();

      return;
    }

    this.form.activationDeactivationSysId =
      item.sysId;

    this.form.activationDeactivationCode =
      item.code;

    this.form.activationDeactivationName =
      item.name;
  }


  clearActivation() {

    this.form.activationDeactivationSysId =
      null;

    this.form.activationDeactivationCode =
      '';

    this.form.activationDeactivationName =
      '';
  }


  getCompanyById(
    id: number
  ): LookupItem | undefined {

    return this.companyOptions.find(
      item => item.sysId === id
    );
  }


  selectCompany(
    row: CompanyRow,
    item: LookupItem | undefined
  ) {

    if (!item) {
      return;
    }

    row.companySysId =
      item.sysId;

    row.companyCode =
      item.code;

    row.companyName =
      item.name;
  }


  /*
   * FIRST CLICK:
   *   Remove the initial ... row
   *   and show ONE normal row.
   *
   * NEXT CLICKS:
   *   Add another normal row.
   */
  addRow(): void {

    if (this.companyLookupMode) {

      this.companyLookupMode = false;

      return;
    }

    this.form.companies.push(
      this.blankCompany()
    );
  }


  removeRow(index: number): void {

    if (
      this.form.companies.length > 1
    ) {

      this.form.companies.splice(
        index,
        1
      );

      return;
    }

    /*
     * Keep one empty row instead
     * of removing the last row.
     */
    this.form.companies[0] =
      this.blankCompany();
  }


  save() {

    this.message = '';

    this.error = '';

    if (
      !this.form.code?.trim() ||
      !this.form.name?.trim()
    ) {

      this.error =
        'Cost Center Code and Cost Center Name are required.';

      return;
    }

    this.saving = true;

    const request =
      this.editingId
        ? this.api.update(
            this.editingId,
            this.form
          )
        : this.api.save(
            this.form
          );

    request.subscribe({

      next: response => {

        this.saving = false;

        this.message =
          response.message;

        this.loadList();

        setTimeout(() => {

          this.showList();

        }, 500);
      },

      error: err => {

        this.saving = false;

        this.error =
          err?.error?.message ||
          'Save failed';
      }
    });
  }


  cancel() {

    this.newForm();
  }


  remove(c: CostCenter) {

    if (!c.sysId) {
      return;
    }

    if (
      !confirm(
        `Delete Cost Center ${c.code}?`
      )
    ) {

      return;
    }

    this.api.delete(
      c.sysId
    ).subscribe({

      next: response => {

        this.message =
          response.message;

        this.loadList();
      },

      error: err => {

        this.error =
          err?.error?.message ||
          'Delete failed';
      }
    });
  }


  search(query: string) {

    const value =
      query
        .toLowerCase()
        .trim();

    if (!value) {

      this.loadList();

      return;
    }

    this.centers =
      this.centers.filter(
        center =>
          [
            center.code,
            center.name,
            center.activationDeactivationCode,
            ...center.companies.map(
              company =>
                company.companyCode
            )
          ].some(
            item =>
              item
                ?.toLowerCase()
                .includes(value)
          )
      );
  }
}