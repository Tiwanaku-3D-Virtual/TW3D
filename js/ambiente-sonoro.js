export function createWindToggle(button){
  let context=null,gain=null,enabled=false;
  button.addEventListener('click',async()=>{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass){button.textContent='Sonido no disponible';button.disabled=true;return;}
    if(!context){
      context=new AudioContextClass();const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate);const data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.45;
      const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=470;filter.Q.value=.6;
      gain=context.createGain();gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start();
    }
    if(context.state==='suspended')await context.resume();
    enabled=!enabled;gain.gain.setTargetAtTime(enabled ? .018 : 0,context.currentTime,.25);
    button.textContent=enabled?'🔇 Silenciar':'🔈 Viento';button.setAttribute('aria-label',enabled?'Silenciar el viento ambiental':'Activar el viento ambiental');
  });
}
