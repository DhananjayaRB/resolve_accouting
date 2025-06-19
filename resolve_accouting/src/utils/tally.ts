import { PayrollData, PayrollHeader } from '../types';

interface TallyConfig {
  ip: string;
  port: number;
}

export const generateTallyXML = (payrollData: PayrollData[], headers: PayrollHeader[], period: string): string => {
  // Format date as YYYYMMDD
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getFullYear().toString() +
           (date.getMonth() + 1).toString().padStart(2, '0') +
           date.getDate().toString().padStart(2, '0');
  };

  // Create the XML structure for Tally
  //  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>LKQ India Private Limited</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <OLDAUDITENTRYIDS.LIST TYPE="Number">
              <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
            </OLDAUDITENTRYIDS.LIST>
            <DATE>${formatDate(period)}</DATE>
            <REFERENCEDATE>${formatDate(period)}</REFERENCEDATE>
            <VCHSTATUSDATE>${formatDate(period)}</VCHSTATUSDATE>
            <NARRATION>Resolve Pay Test</NARRATION>
            <ENTEREDBY>venkat@resolveindia.com</ENTEREDBY>
            <OBJECTUPDATEACTION>Create</OBJECTUPDATEACTION>
            <GSTREGISTRATION TAXTYPE="GST" TAXREGISTRATION="29AADCK5392D1ZE">LKQ India Private Limited (GST)</GSTREGISTRATION>
            <CMPGSTIN>29AADCK5392D1ZE</CMPGSTIN>
            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <CMPGSTREGISTRATIONTYPE>Regular</CMPGSTREGISTRATIONTYPE>
            <REFERENCE>PTUT/2024-25/001</REFERENCE>
            <NUMBERINGSTYLE>Auto Retain</NUMBERINGSTYLE>
            <CSTFORMISSUETYPE>Not Applicable</CSTFORMISSUETYPE>
            <CSTFORMRECVTYPE>Not Applicable</CSTFORMRECVTYPE>
            <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <VCHSTATUSTAXADJUSTMENT>Default</VCHSTATUSTAXADJUSTMENT>
            <VCHSTATUSVOUCHERTYPE>Journal</VCHSTATUSVOUCHERTYPE>
            <VCHSTATUSTAXUNIT>LKQ India Private Limited (GST)</VCHSTATUSTAXUNIT>
            <VCHGSTCLASS>Not Applicable</VCHGSTCLASS>
            <VCHENTRYMODE>As Voucher</VCHENTRYMODE>
            <DIFFACTUALQTY>No</DIFFACTUALQTY>
            <ISMSTFROMSYNC>No</ISMSTFROMSYNC>
            <ISDELETED>No</ISDELETED>
            <ISSECURITYONWHENENTERED>Yes</ISSECURITYONWHENENTERED>
            <ASORIGINAL>No</ASORIGINAL>
            <AUDITED>No</AUDITED>
            <ISCOMMONPARTY>No</ISCOMMONPARTY>
            <FORJOBCOSTING>No</FORJOBCOSTING>
            <ISOPTIONAL>No</ISOPTIONAL>
            <EFFECTIVEDATE>${formatDate(period)}</EFFECTIVEDATE>
            <ALTERID> 194623</ALTERID>
            <MASTERID> 78288</MASTERID>
            <VOUCHERKEY>196116796670200</VOUCHERKEY>
            <VOUCHERRETAINKEY>61869</VOUCHERRETAINKEY>
            <VOUCHERNUMBERSERIES>Default</VOUCHERNUMBERSERIES>
            <UPDATEDDATETIME>${formatDate(period)}171839000</UPDATEDDATETIME>
            ${payrollData.map(employee => {
              // Get all pay head values for this employee
              const payHeadValues = headers
                .filter(header => header.is_pay_head === "1")
                .map(header => {
                  const payValue = employee.pay_value_data?.find(pv => pv.data_field_name === header.dataField);
                  return {
                    name: header.text,
                    value: payValue?.pay_value || "0"
                  };
                });

              // Calculate total amount
              const totalAmount = payHeadValues.reduce((sum, item) => sum + Number(item.value), 0);

              return `
              <ALLLEDGERENTRIES.LIST>
                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                  <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                </OLDAUDITENTRYIDS.LIST>
                <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
                <LEDGERNAME>Salary Payable</LEDGERNAME>
                <GSTCLASS>Not Applicable</GSTCLASS>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${totalAmount.toFixed(2)}</AMOUNT>
                <VATEXPAMOUNT>-${totalAmount.toFixed(2)}</VATEXPAMOUNT>
                <SERVICETAXDETAILS.LIST></SERVICETAXDETAILS.LIST>
                <CATEGORYALLOCATIONS.LIST>
                  <CATEGORY>Location</CATEGORY>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <COSTCENTREALLOCATIONS.LIST>
                    <NAME>Primeco Towers ,Bannerghatta</NAME>
                    <AMOUNT>-${totalAmount.toFixed(2)}</AMOUNT>
                  </COSTCENTREALLOCATIONS.LIST>
                </CATEGORYALLOCATIONS.LIST>
              </ALLLEDGERENTRIES.LIST>
              ${payHeadValues.map(payHead => `
              <ALLLEDGERENTRIES.LIST>
                <OLDAUDITENTRYIDS.LIST TYPE="Number">
                  <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
                </OLDAUDITENTRYIDS.LIST>
                <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
                <LEDGERNAME>${payHead.name}</LEDGERNAME>
                <GSTCLASS>Not Applicable</GSTCLASS>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${Number(payHead.value).toFixed(2)}</AMOUNT>
                <VATEXPAMOUNT>${Number(payHead.value).toFixed(2)}</VATEXPAMOUNT>
                <SERVICETAXDETAILS.LIST></SERVICETAXDETAILS.LIST>
                <CATEGORYALLOCATIONS.LIST>
                  <CATEGORY>Location</CATEGORY>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <COSTCENTREALLOCATIONS.LIST>
                    <NAME>Primeco Towers ,Bannerghatta</NAME>
                    <AMOUNT>${Number(payHead.value).toFixed(2)}</AMOUNT>
                  </COSTCENTREALLOCATIONS.LIST>
                </CATEGORYALLOCATIONS.LIST>
              </ALLLEDGERENTRIES.LIST>
              `).join('')}`;
            }).join('')}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  return xml;
};

export const pushToTally = async (): Promise<boolean> => {
  try {
    const xml = `<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Vouchers</REPORTNAME>
    <STATICVARIABLES>
     <SVCURRENTCOMPANY>LKQ India Private Limited</SVCURRENTCOMPANY>
    </STATICVARIABLES>
   </REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
      <OLDAUDITENTRYIDS.LIST TYPE="Number">
       <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
      </OLDAUDITENTRYIDS.LIST>
      <DATE>20250530</DATE>
      <REFERENCEDATE>20250530</REFERENCEDATE>
      <VCHSTATUSDATE>20250530</VCHSTATUSDATE>
      <NARRATION>Resolve Pay Test11</NARRATION>
      <ENTEREDBY>venkat@resolveindia.com</ENTEREDBY>
      <OBJECTUPDATEACTION>Create</OBJECTUPDATEACTION>
      <GSTREGISTRATION TAXTYPE="GST" TAXREGISTRATION="29AADCK5392D1ZE">LKQ India Private Limited (GST)</GSTREGISTRATION>
      <CMPGSTIN>29AADCK5392D1ZE</CMPGSTIN>
      <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
      <CMPGSTREGISTRATIONTYPE>Regular</CMPGSTREGISTRATIONTYPE>
      <REFERENCE>PTUT/2024-25/001</REFERENCE>
      <NUMBERINGSTYLE>Auto Retain</NUMBERINGSTYLE>
      <CSTFORMISSUETYPE>Not Applicable</CSTFORMISSUETYPE>
      <CSTFORMRECVTYPE>Not Applicable</CSTFORMRECVTYPE>
      <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
      <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
      <VCHSTATUSTAXADJUSTMENT>Default</VCHSTATUSTAXADJUSTMENT>
      <VCHSTATUSVOUCHERTYPE>Journal</VCHSTATUSVOUCHERTYPE>
      <VCHSTATUSTAXUNIT>LKQ India Private Limited (GST)</VCHSTATUSTAXUNIT>
      <VCHGSTCLASS>Not Applicable</VCHGSTCLASS>
      <VCHENTRYMODE>As Voucher</VCHENTRYMODE>
      <DIFFACTUALQTY>No</DIFFACTUALQTY>
      <ISMSTFROMSYNC>No</ISMSTFROMSYNC>
      <ISDELETED>No</ISDELETED>
      <ISSECURITYONWHENENTERED>Yes</ISSECURITYONWHENENTERED>
      <ASORIGINAL>No</ASORIGINAL>
      <AUDITED>No</AUDITED>
      <ISCOMMONPARTY>No</ISCOMMONPARTY>
      <FORJOBCOSTING>No</FORJOBCOSTING>
      <ISOPTIONAL>No</ISOPTIONAL>
      <EFFECTIVEDATE>20250530</EFFECTIVEDATE>
      <ALTERID> 194623</ALTERID>
      <MASTERID> 78288</MASTERID>
      <VOUCHERKEY>196116796670200</VOUCHERKEY>
      <VOUCHERRETAINKEY>61869</VOUCHERRETAINKEY>
      <VOUCHERNUMBERSERIES>Default</VOUCHERNUMBERSERIES>
      <UPDATEDDATETIME>20250130171839000</UPDATEDDATETIME>
      <ALLLEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
       <LEDGERNAME>Recruitment charges</LEDGERNAME>
       <GSTCLASS>Not Applicable</GSTCLASS>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-72472.00</AMOUNT>
       <VATEXPAMOUNT>-72472.00</VATEXPAMOUNT>
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <CATEGORYALLOCATIONS.LIST>
        <CATEGORY>Location</CATEGORY>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <COSTCENTREALLOCATIONS.LIST>
         <NAME>Primeco Towers ,Bannerghatta</NAME>
         <AMOUNT>-72472.00</AMOUNT>
        </COSTCENTREALLOCATIONS.LIST>
       </CATEGORYALLOCATIONS.LIST>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
       <LEDGERNAME>Input CGST</LEDGERNAME>
       <GSTCLASS>Not Applicable</GSTCLASS>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-6522.00</AMOUNT>
       <VATEXPAMOUNT>-6522.00</VATEXPAMOUNT>
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <CATEGORYALLOCATIONS.LIST>
        <CATEGORY>Location</CATEGORY>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <COSTCENTREALLOCATIONS.LIST>
         <NAME>Primeco Towers ,Bannerghatta</NAME>
         <AMOUNT>-6522.00</AMOUNT>
        </COSTCENTREALLOCATIONS.LIST>
       </CATEGORYALLOCATIONS.LIST>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
       <LEDGERNAME>Input SGST</LEDGERNAME>
       <GSTCLASS>Not Applicable</GSTCLASS>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-6522.00</AMOUNT>
       <VATEXPAMOUNT>-6522.00</VATEXPAMOUNT>
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <CATEGORYALLOCATIONS.LIST>
        <CATEGORY>Location</CATEGORY>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <COSTCENTREALLOCATIONS.LIST>
         <NAME>Primeco Towers ,Bannerghatta</NAME>
         <AMOUNT>-6522.00</AMOUNT>
        </COSTCENTREALLOCATIONS.LIST>
       </CATEGORYALLOCATIONS.LIST>
      </ALLLEDGERENTRIES.LIST>
	  <ALLLEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
       <LEDGERNAME>TDS - Professional Charges</LEDGERNAME>
       <GSTCLASS>Not Applicable</GSTCLASS>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <AMOUNT>7247.00</AMOUNT>
       <VATEXPAMOUNT>7247.00</VATEXPAMOUNT>
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <CATEGORYALLOCATIONS.LIST>
        <CATEGORY>Location</CATEGORY>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <COSTCENTREALLOCATIONS.LIST>
         <NAME>Primeco Towers ,Bannerghatta</NAME>
         <AMOUNT>7247.00</AMOUNT>
        </COSTCENTREALLOCATIONS.LIST>
       </CATEGORYALLOCATIONS.LIST>
       <BANKALLOCATIONS.LIST>       </BANKALLOCATIONS.LIST>
       <BILLALLOCATIONS.LIST>
        <NAME>TDS/GHCS/LQ/24/0015</NAME>
        <BILLTYPE>New Ref</BILLTYPE>
        <TDSDEDUCTEEISSPECIALRATE>No</TDSDEDUCTEEISSPECIALRATE>
        <AMOUNT>7247.00</AMOUNT>
       </BILLALLOCATIONS.LIST>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
       <OLDAUDITENTRYIDS.LIST TYPE="Number">
        <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
       </OLDAUDITENTRYIDS.LIST>
       <APPROPRIATEFOR>Not Applicable</APPROPRIATEFOR>
       <LEDGERNAME>Glympse Human Capital Services</LEDGERNAME>
       <GSTCLASS>Not Applicable</GSTCLASS>
       <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
       <AMOUNT>78269.00</AMOUNT>
       <VATEXPAMOUNT>78269.00</VATEXPAMOUNT>
       <SERVICETAXDETAILS.LIST>       </SERVICETAXDETAILS.LIST>
       <CATEGORYALLOCATIONS.LIST>
        <CATEGORY>Location</CATEGORY>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <COSTCENTREALLOCATIONS.LIST>
         <NAME>Primeco Towers ,Bannerghatta</NAME>
         <AMOUNT>78269.00</AMOUNT>
        </COSTCENTREALLOCATIONS.LIST>
       </CATEGORYALLOCATIONS.LIST>
       <BANKALLOCATIONS.LIST>       </BANKALLOCATIONS.LIST>
       <BILLALLOCATIONS.LIST>
        <NAME>GHCS/LQ/24/0015</NAME>
        <BILLTYPE>New Ref</BILLTYPE>
        <TDSDEDUCTEEISSPECIALRATE>No</TDSDEDUCTEEISSPECIALRATE>
        <AMOUNT>78269.00</AMOUNT>
       </BILLALLOCATIONS.LIST>
      </ALLLEDGERENTRIES.LIST>
     </VOUCHER>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;

    const response = await fetch('https://uat-api.resolveindia.com/organization/import-to-tally', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        tally_ip: "74.225.142.112",
        taly_port: "9000",
        tallydata: xml
      })
    });

    const responseText = await response.text();
    console.log('API Response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to push to Tally: ${responseText}`);
    }

    return true;
  } catch (error) {
    console.error('Error pushing to Tally:', error);
    throw error;
  }
}; 