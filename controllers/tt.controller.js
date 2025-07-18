import XLSX from 'xlsx';
export const uploadLeadsfile = (req, res) => {
  try {
    const incoming = req.files.files;
    const files = Array.isArray(incoming) ? incoming : [incoming];

    const result = [];

    if (!files.length) {
      return res.status(401);
    }
    files.forEach((file) => {
      const workBook = XLSX.read(file.data, { type: 'buffer' });

      const sheetName = workBook.SheetNames[0];
      const workSheet = workBook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(workSheet);
      const systemFields = [
        'lead_id',
        'created_time',
        'ad_id',
        'ad_name',
        'adgroup_id',
        'adgroup_name',
        'campaign_id',
        'campaign_name',
        'form_id',
        'form_name',
      ];

      const contactFields = ['Email', 'Name', 'Last name', 'Phone number'];

      const parsed = jsonData.map((row) => {
        const email = row.Email || '';
        // const fullName = row.Name || '';
        const firstName = row['First name'] || row['Name'] || '';
        const lastName = row['Last name'] || '';
        const phone = row['Phone number'] || '';

        const customFields = Object.entries(row).filter(
          ([key]) => !systemFields.includes(key) && !contactFields.includes(key)
        );

        const answers = customFields.map((answer) => `${answer[1]}; `);

        return {
          fullName: `${firstName} ${lastName}`,
          phone,
          email,
          answers: answers.join(''),
        };
      });
      result.push(...parsed);
    });

    res.status(200).json({ msg: 'hello', data: result });
  } catch (err) {
    if (err) console.log(err);
  }
};
