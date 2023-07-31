const tmpl8 = (template, attributes) => {
  try {
    let templateStr = `const D=(e,t)=>{const s=new Date(e);if(!t)return s.toString();const r=s.getFullYear(),i=s.getMonth(),n=s.getDate(),d=s.getDay(),c=s.getHours(),g=s.getMinutes(),y=s.getSeconds(),M=s.getMilliseconds(),a=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],l=["January","February","March","April","May","June","July","August","September","October","November","December"],u={yy:String(r).slice(-2),yyyy:String(r),M:String(i+1),MM:("0"+(i+1)).slice(-2),MMM:l[i].slice(0,3),MMMM:l[i],d:String(n),dd:("0"+n).slice(-2),ddd:a[d].slice(0,3),dddd:a[d],H:String(c),HH:("0"+c).slice(-2),h:String(c%12||12),hh:("0"+(c%12||12)).slice(-2),t:c<12?"A":"P",tt:c<12?"AM":"PM",m:String(g),mm:("0"+g).slice(-2),s:String(y),ss:("0"+y).slice(-2),sss:("00"+M).slice(-3)};return t.replace(/\\[([^\\]]+)]|y{2,4}|M{1,4}|d{1,4}|H{1,2}|h{1,2}|t{1,2}|m{1,2}|s{1,3}/g,((e,t)=>t||u[e]))};`;
    templateStr += `const N=(t,i)=>{if(!t&&0!==t)return"";if(!i)return new Intl.NumberFormat("default").format(t);const e=i.split(";").map((t=>t.trim())),m=e.length>1?e[1]:"default",[r,n]=e[0].split(".");let s={};if(r){const[t,i,e]=r.match(/[ ]*(\\+?)[ ]*(\\d*)/);i&&(s.signDisplay="always");const m=Number(e);Number.isInteger(m)&&m>0&&m<22&&(s.minimumIntegerDigits=m)}if(n){const[t,i]=n.split(",").map(Number);Number.isInteger(t)&&t>-1&&t<21&&(s.minimumFractionDigits=t),Number.isInteger(i)&&i>-1&&i<21&&(s.maximumFractionDigits=i)}return new Intl.NumberFormat(m,s).format(t)};`;
    templateStr += `const B=(t,e)=>{if(t=Number(t),!e)return t;const r=["byte","kilobyte","megabyte","gigabyte","terabyte","petabyte"],a=r.reduce(((t,e,r)=>({...t,[r?e.charAt(0)+"b":"b"]:Math.pow(1024,r)})),{}),[b,n,o]=e.match(/[ ]*([kmgtp]?b)[ ]*>?[ ]*([kmgtp]?b)?[ ]*/i),m=(o||n).toLowerCase(),u=o?Math.floor(t*a[n]):t,c=r[r.findIndex((t=>t.charAt(0)===m.charAt(0)))];return new Intl.NumberFormat("default",{style:"unit",unit:c}).format(u/a[m])};`;
    templateStr += `const {${attributes
      .filter(a => !/[\W_]+/g.test(a))
      .join(',')}} = data;let str='`;

    templateStr += template
      .replace(/\{\{\?\s*([\s\S]*?)\s*\}\}/g, (_match, arg) =>
        arg ? `';if (${arg}){str+='` : `';}str+='`
      )
      .replace(/\{\{([\s\S]+?)\}\}/g, (_match, arg) => {
        const parts = arg.match(/^[ ]*([~!@#])[ ]*([\S\s]*)/);
        if (!parts) return `';str+=data['${arg}'];str+='`;
        const [, type, rest] = parts;
        const [attr, format] = rest.split(/\s*\|\s*/);
        if (type === '~' && format)
          return `';str+=B(data['${attr}'],'${format}');str+='`;
        if (type === '~') return `';str+=B(data['${attr}']);str+='`;
        if (type === '!')
          return `';str+=Boolean(data['${attr}']).toString();str+='`;
        if (type === '@' && format)
          return `';str+=D(data['${attr}'],'${format}');str+='`;
        if (type === '@') return `';str+=D(data['${attr}']);str+='`;
        if (type === '#' && format)
          return `';str+=N(data['${attr}'],'${format}');str+='`;
        if (type === '#') return `';str+=N(data['${attr}']);str+='`;
      })
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r');

    templateStr += `'; return str;`;

    return new Function('data', templateStr); // eslint-disable-line no-new-func
  } catch (e) {
    throw new Error(`Templating Error: ${e.message}`);
  }
};

export default tmpl8;
