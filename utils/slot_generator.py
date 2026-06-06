from datetime import datetime, timedelta

def generate_slots(start_date, end_date, start_time, end_time, slot_duration_mins, booked_slots):
    try: 
        start_d = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_d = datetime.strptime(end_date, "%Y-%m-%d").date()

    except ValueError as e:
        raise ValueError(f"Date parsing failed: {e}. Dates must be in 'YYYY-MM-DD' format.")
    
    try: 
        datetime.strptime(start_time, "%H:%M")
        datetime.strptime(end_time, "%H:%M")
    
    except ValueError as e:
        raise ValueError(f"Time parsing failed: {e}. Times must be in 'HH:MM' format.")
    
    booked_set = set()
    for item in booked_slots:
        if isinstance(item, dict):
            date_val = item.get('date')
            time_val = item.get('startTime')
            if date_val and time_val:
                booked_set.add((date_val, time_val))
        elif isinstance(item, (tuple, list)) and len(item) >= 2:
            booked_set.add((item[0], item[1]))

        slots =[]
        current_d = start_d
        duration = timedelta(minutes=int(slot_duration_mins))

        while current_d <= end_d:
            date_str = current_d.strftime("%Y-%m-%d")

            start_dt = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{date_str} {end_time}", "%Y-%m-%d %H:%M")

            current_dt = start_dt

            while current_dt + duration <= end_dt:
                slot_start = current_dt.strftime("%H:%M")

                slot_end = (current_dt + duration).strftime("%H:%M")

                if(date_str, slot_start) not in booked_set:
                    slots.append({
                        "date": date_str,
                        "start": slot_start,
                        "end": slot_end
                    })

                current_dt += duration
            
            current_d += timedelta(days=1)
        
        return slots