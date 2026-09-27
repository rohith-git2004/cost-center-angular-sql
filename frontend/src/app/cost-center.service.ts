import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LookupItem {
  sysId: number;
  code: string;
  name: string;
}

export interface CompanyRow {
  companySysId: number;
  companyCode: string;
  companyName: string;
}

export interface CostCenter {
  sysId?: number;

  code: string;

  name: string;

  activationDeactivationYn: 'Y' | 'N';

  activationDeactivationSysId: number | null;

  activationDeactivationCode: string;

  activationDeactivationName: string;

  companies: CompanyRow[];
}

@Injectable({
  providedIn: 'root'
})
export class CostCenterService {

  private http = inject(HttpClient);

  private base = 'http://localhost:5000/api';


  // =========================================
  // GET ALL COST CENTERS
  // =========================================

  list(): Observable<CostCenter[]> {

    return this.http.get<CostCenter[]>(
      `${this.base}/cost-centers`
    );

  }


  // =========================================
  // CREATE COST CENTER
  // =========================================

  save(
    data: CostCenter
  ): Observable<{
    message: string;
    sysId?: number;
  }> {

    return this.http.post<{
      message: string;
      sysId?: number;
    }>(
      `${this.base}/cost-centers`,
      data
    );

  }


  // =========================================
  // UPDATE COST CENTER
  // =========================================

  update(
    id: number,
    data: CostCenter
  ): Observable<{
    message: string;
  }> {

    return this.http.put<{
      message: string;
    }>(
      `${this.base}/cost-centers/${id}`,
      data
    );

  }


  // =========================================
  // DELETE COST CENTER
  // =========================================

  delete(
    id: number
  ): Observable<{
    message: string;
  }> {

    return this.http.delete<{
      message: string;
    }>(
      `${this.base}/cost-centers/${id}`
    );

  }


  // =========================================
  // ACTIVATION / DEACTIVATION LOOKUP
  // =========================================

  activation(): Observable<LookupItem[]> {

    return this.http.get<LookupItem[]>(
      `${this.base}/lookups/activation`
    );

  }


  // =========================================
  // COMPANY LOOKUP
  // =========================================

  companies(): Observable<LookupItem[]> {

    return this.http.get<LookupItem[]>(
      `${this.base}/lookups/companies`
    );

  }

}