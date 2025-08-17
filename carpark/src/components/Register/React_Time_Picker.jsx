import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/Clock.css';

import { useState } from 'react';
import TimePicker from 'react-time-picker';

const React_Time_Picker=()=> {
  const [value, onChange] = useState('10:00');

  return (
    <div>
      <TimePicker onChange={onChange} value={value} />
    </div>
  );
}

export default React_Time_Picker;