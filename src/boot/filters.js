import moment from "moment";

export default async ({Vue}) => {
  Vue.filter('moment', (value, format) => {
    if (format === 'from') return moment(value).fromNow();
    return moment(value).format(format);
  })
}
