$(() => {
    const day = new Date().toLocaleDateString('pt-BR', {
        day : 'numeric',
        month : 'numeric',
        year : 'numeric'
    }).split(' ')[0].substring(0, 5);
    
    let dayRow;
    $(".table-batidas:eq(1) tbody tr").each((index, value) => {
      if ($(value).find("td:first").text().trim() == day) {
        dayRow = value;
        return;
      }
    });
    
    let necessaryHours = 8;
    let necessaryMinutes = 48;
    let leaveHours, leaveMinutes, startedHours, startedMinutes;
    
    let workedHours = $(dayRow).find("td:eq(6)").text().replace('Horas Trabalhadas: ', '');
    if (workedHours != '') {
      workedHours = workedHours.split(':')
    
      const lastTrack = $(dayRow).find("td:eq(2)").text().trim().split(', ')[2].split(':');
      startedHours = parseInt(lastTrack[0]);
      startedMinutes = parseInt(lastTrack[1]);
    
      const hours = parseInt(workedHours[0]);
      const minutes = parseInt(workedHours[1]);
      if (necessaryMinutes < minutes) {
        necessaryMinutes = 60 - minutes + necessaryMinutes;
        necessaryHours = necessaryHours - hours - 1;
      } else {
        necessaryMinutes = necessaryMinutes - minutes;
        necessaryHours = necessaryHours - hours;
      }
    } else {
      const firstTrack = $(dayRow).find("td:eq(2)").text().trim().split(':');
    
      startedHours = parseInt(firstTrack[0]);
      startedMinutes = parseInt(firstTrack[1]);
    }
    
    leaveHours = startedHours + necessaryHours;
    leaveMinutes = startedMinutes + necessaryMinutes;
    
    if (leaveMinutes >= 60) {
      leaveMinutes = leaveMinutes - 60;
      leaveHours++;
    } 
    
    const tracksTd = $(dayRow).find("td:eq(2)");
    $(tracksTd).html(`${$(tracksTd).html().trim()}, \<span style="font-weight:bold;color:green;">${leaveHours.toString().padStart(2, '0')}:${leaveMinutes.toString().padStart(2, '0')}</span>`);    
});
