class AhgoraVai {
  async execute() {
    this.workload = '08:48';
    this.dailyTable = $('.table-batidas:eq(1) tbody tr');
    this.totalTable = $('#tableTotalize tbody tr');

    await this.recalculateWithJustifies();
    this.canIGoHome();
  }

  async forEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  parse(hourFormatted) {
    const hour = hourFormatted.trim().split(':');
    const parsed = {
      hour: parseInt(hour[0]),
      minute: parseInt(hour[1])
    };

    if (hourFormatted.trim().startsWith('-')) {
      parsed.minute = parsed.minute * -1;
    }

    return parsed;
  }

  format(hour) {
    let minute = hour.minute < 0 ? hour.minute * -1 : hour.minute;
    const twoDigits = (value) => !value ? value : value.toString().padStart(2, '0');
    return `${twoDigits(hour.hour)}:${twoDigits(minute)}`;
  }

  sum(hour1, hour2) {
    let hour = hour1.hour + hour2.hour;
    let minute = hour1.minute + hour2.minute;

    if (minute >= 60) {
      minute = minute - 60;
      hour++;
    }

    if (hour < 0 && minute > 0) {
      minute = minute * -1;
    }

    return { hour, minute };
  }

  subtract(hour1, hour2) {
    let hour;
    let minute;

    if (hour1.minute < hour2.minute) {
      minute = 60 - hour2.minute + hour1.minute;
      hour = hour1.hour - hour2.hour + 1;
    } else {
      minute = hour1.minute - hour2.minute;
      hour = hour1.hour - hour2.hour;
    }

    if (hour < 0 && minute > 0) {
      minute = minute * -1;
    }

    return { hour, minute };
  }

  async recalculateWithJustifies() {
    let totalWorked = { hour: 0, minute: 0 };
    let partialAlreadyTotalized = { hour: 0, minute: 0 };

    await this.forEach($('.new-logic-justify.text-dark-blue'), async (element) => {
      let justifyResponse = await $.post(
          'https://www.ahgora.com.br/justificativa/getListJustifyByDate',
          { date: $(element).data('datedb') }
      ).then();

      const justifies = justifyResponse.listJustify.map(justify => justify.addPunch.punch);
    
      const row = $(element).parents('tr');
      const tracksTd = $(row).find('td:eq(2)');
      let tracks = tracksTd.html();
      if (tracks != '') {
          tracks += ', ';
      }
      tracks += justifies.join(', ');
      tracks = tracks.split(', ').sort();
      $(tracksTd).html(tracks.join(', '));

      if (tracks.length % 2 != 0) { tracks.slice(-1); }

      if (tracks.length > 0) {
        tracks = tracks.reverse();
        let worked = { hour: 0, minute: 0 };

        for (let i = 0; i < tracks.length; i = i + 2) {
          worked = this.sum(
            worked,
            this.subtract(this.parse(tracks[i]), this.parse(tracks[i + 1]))
          );
        }

        const workedHoursOld = $(row).find('td:eq(6)').html().split('<br>')[0].split(': ')[1];
        if (workedHoursOld != `-${this.workload}`) {
          partialAlreadyTotalized = this.sum(partialAlreadyTotalized, this.parse(workedHoursOld));
        }
        totalWorked = this.sum(totalWorked, worked);

        $(row).find('td:eq(6)').html(`Horas Trabalhadas: ${this.format(worked)}`);
      }
    });

    if (totalWorked.hour > 0 || totalWorked.minute > 0) {
      this.refreshTotal(this.subtract(totalWorked, partialAlreadyTotalized));
    }
  }

  refreshTotal(workedNotTotalized) {
    $(this.totalTable).each((index, element) => {
      let description = $(element).find('td:first').html().trim();

      if (description == 'SALDO') {
        const currentTotal = this.parse($(element).find('td:eq(1)').html());
        const newTotal = this.sum(currentTotal, workedNotTotalized);
        const newClass = newTotal.hour > 0 || newTotal.minute > 0 ? 'success' : 'danger';

        $(element).find('td:eq(1)')
          .removeClass('success')
          .removeClass('danger')
          .addClass(newClass)
          .html(`${this.format(currentTotal)} + ${this.format(workedNotTotalized)} = ${this.format(newTotal)}`);
      }
    });
  }

  canIGoHome() {
    const today = new Date().toLocaleDateString('pt-BR', {
      day : 'numeric',
      month : 'numeric',
      year : 'numeric'
    }).split(' ')[0].substring(0, 5);

    let dayRow;
    $(this.dailyTable).each((i, value) => {
      if ($(value).find('td:first').text().trim() == today) {
        dayRow = value;
        return;
      }
    });

    let workload = this.parse(this.workload);
    let leave, started;

    let worked = $(dayRow).find('td:eq(6)').text().replace('Horas Trabalhadas: ', '');
    if (worked != '') {
      worked = this.parse(worked);
      workload = this.subtract(workload, worked);

      const tracks = $(dayRow).find('td:eq(2)').text().trim().split(', ');
      started = this.parse(tracks[tracks.length - 1]);
    } else {
      const firstTrack = $(dayRow).find('td:eq(2)').text().trim();
      if (firstTrack == '') { return; }

      started = this.parse(firstTrack);
    }

    leave = this.sum(started, workload);

    const tracksTd = $(dayRow).find('td:eq(2)');
    $(tracksTd).html(`${$(tracksTd).html().trim()}, \<span style='font-weight:bold;color:green;'>${this.format(leave)}</span>`);
  }
}

$(() => {
  const ahgoraVai = new AhgoraVai();
  ahgoraVai.execute();
});
