import random
import datetime

# Configuration
num_students = 200
num_companies = 15
target_applications = 560
hash_pass = "$2a$10$WKCDPr6Q3yxmGhCzMsg/WuLOJxEHGz0R2tZuhluwjrqiB4kavg01e" # password123

# Seed lists
first_names = [
    "Amit", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Rajesh", "Karan", "Divya", "Sanjay",
    "Arjun", "Neha", "Rahul", "Pooja", "Gaurav", "Shruti", "Aditya", "Deepa", "Vijay", "Ritu",
    "Abhishek", "Meera", "Kunal", "Sunita", "Manoj", "Nisha", "Harish", "Jyoti", "Vivek", "Preeti",
    "Akash", "Swati", "Siddharth", "Kiran", "Mayank", "Shalini", "Pranav", "Aarti", "Varun", "Tanvi",
    "Ravi", "Aditi", "Manish", "Kavita", "Sandeep", "Anjali", "Rakesh", "Payal", "Anil", "Sheetal"
]

last_names = [
    "Sharma", "Patel", "Das", "Reddy", "Singh", "Roy", "Kumar", "Johar", "Nair", "Dutt",
    "Gupta", "Verma", "Mehta", "Joshi", "Rao", "Iyer", "Nair", "Pillai", "Chawla", "Kapoor",
    "Sen", "Bose", "Chatterjee", "Banerjee", "Mukherjee", "Gill", "Dhillon", "Sandhu", "Bhat", "Kaul",
    "Sinha", "Mishra", "Pandey", "Trivedi", "Shukla", "Bajpai", "Saxena", "Srivastava", "Dubey", "Pathak"
]

departments = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering"
]

companies_pool = [
    ("TCS", 3.6, 6.0, "Computer Science,Information Technology,Electronics & Communication"),
    ("Infosys", 4.0, 6.2, "Computer Science,Information Technology,Electronics & Communication"),
    ("Wipro", 3.8, 6.0, "Computer Science,Information Technology,Electronics & Communication"),
    ("Cognizant", 4.2, 6.5, "Computer Science,Information Technology,Electronics & Communication,Mechanical Engineering,Electrical Engineering"),
    ("Accenture", 4.5, 6.5, "Computer Science,Information Technology,Electronics & Communication,Mechanical Engineering,Electrical Engineering,Civil Engineering"),
    ("Capgemini", 4.0, 6.0, "Computer Science,Information Technology,Electronics & Communication"),
    ("IBM", 7.5, 7.0, "Computer Science,Information Technology,Electronics & Communication"),
    ("HCL", 3.5, 6.0, "Computer Science,Information Technology,Electronics & Communication,Mechanical Engineering,Electrical Engineering,Civil Engineering"),
    ("Tech Mahindra", 3.6, 6.0, "Computer Science,Information Technology,Electronics & Communication,Mechanical Engineering,Electrical Engineering"),
    ("Deloitte", 6.2, 6.8, "Computer Science,Information Technology"),
    ("L&T Technology", 4.8, 6.5, "Mechanical Engineering,Civil Engineering,Electrical Engineering,Electronics & Communication"),
    ("Tata Motors", 6.0, 7.0, "Mechanical Engineering,Electrical Engineering"),
    ("Google", 32.5, 8.5, "Computer Science,Information Technology"),
    ("Microsoft", 24.0, 8.0, "Computer Science,Information Technology,Electronics & Communication"),
    ("Amazon", 18.0, 7.5, "Computer Science,Information Technology,Electrical Engineering")
]

# Generate Students
students = []
used_emails = set()
used_regs = set()

dept_prefixes = {
    "Computer Science": "CS",
    "Information Technology": "IT",
    "Electronics & Communication": "EC",
    "Mechanical Engineering": "ME",
    "Civil Engineering": "CE",
    "Electrical Engineering": "EE"
}

print("Generating students...")
for i in range(1, num_students + 1):
    fname = random.choice(first_names)
    lname = random.choice(last_names)
    name = f"{fname} {lname}"
    
    # ensure unique email
    email = f"{fname.lower()}.{lname.lower()}{i}@student.edu"
    
    dept = random.choice(departments)
    prefix = dept_prefixes[dept]
    reg_no = f"{prefix}2023{i:03d}"
    
    cgpa = round(random.uniform(6.0, 9.8), 2)
    phone = f"+9198765{i:05d}"
    
    # 30% of students have uploaded a resume
    resume_url = None
    resume_file_name = None
    resume_uploaded_at = "NULL"
    if random.random() < 0.35:
        resume_url = f"uploads/resumes/resume_{reg_no}.pdf"
        resume_file_name = f"Resume_{fname}_{lname}.pdf"
        resume_uploaded_at = f"'2026-08-01 10:00:00'"
        
    students.append({
        "id": i,
        "reg_no": reg_no,
        "name": name,
        "email": email,
        "dept": dept,
        "cgpa": cgpa,
        "phone": phone,
        "resume_url": f"'{resume_url}'" if resume_url else "NULL",
        "resume_file_name": f"'{resume_file_name}'" if resume_file_name else "NULL",
        "resume_uploaded_at": resume_uploaded_at
    })

# Generate Companies
companies = []
for idx, c in enumerate(companies_pool, 1):
    desc = f"Placement recruitment drive for {c[0]} technical and non-technical tracks."
    companies.append({
        "id": idx,
        "name": c[0],
        "desc": desc,
        "package": c[1],
        "cgpa": c[2],
        "depts": c[3],
        "deadline": (datetime.date.today() + datetime.timedelta(days=random.randint(15, 60))).strftime("%Y-%m-%d"),
        "drive_date": (datetime.date.today() + datetime.timedelta(days=random.randint(65, 90))).strftime("%Y-%m-%d")
    })

# Check eligibility helper
def check_eligible(student, company):
    if student["cgpa"] < company["cgpa"]:
        return False
    s_dept = student["dept"].lower()
    c_depts = [d.strip().lower() for d in company["depts"].split(",")]
    # branch matching
    match = False
    for cd in c_depts:
        if cd in s_dept:
            match = True
            break
    return match

# Generate Applications (respecting eligibility!)
print("Generating applications...")
applications = []
app_combinations = set()
app_id_counter = 1

attempts = 0
while len(applications) < target_applications and attempts < 20000:
    attempts += 1
    s = random.choice(students)
    c = random.choice(companies)
    
    combo = (s["id"], c["id"])
    if combo in app_combinations:
        continue
        
    if check_eligible(s, c):
        app_combinations.add(combo)
        
        # Determine realistic status distribution
        status_roll = random.random()
        if status_roll < 0.35:
            status = "APPLIED"
        elif status_roll < 0.50:
            status = "SHORTLISTED"
        elif status_roll < 0.65:
            status = "APTITUDE_CLEARED"
        elif status_roll < 0.75:
            status = "TECHNICAL_CLEARED"
        elif status_roll < 0.82:
            status = "HR_CLEARED"
        elif status_roll < 0.90:
            status = "SELECTED"
        else:
            status = "REJECTED"
            
        applied_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(2, 10))
        
        applications.append({
            "id": app_id_counter,
            "student_id": s["id"],
            "company_id": c["id"],
            "applied_date": applied_date.strftime("%Y-%m-%d %H:%M:%S"),
            "status": status
        })
        app_id_counter += 1

print(f"Generated {len(applications)} eligible applications.")

# Generate Status History
history = []
history_counter = 1

status_order = ["APPLIED", "SHORTLISTED", "APTITUDE_CLEARED", "TECHNICAL_CLEARED", "HR_CLEARED", "SELECTED"]

for app in applications:
    cur_status = app["status"]
    # If rejected, they were rejected at some step
    if cur_status == "REJECTED":
        # Reject at a random step
        rej_idx = random.randint(0, 4)
        for idx in range(rej_idx + 1):
            step = status_order[idx]
            history.append({
                "id": history_counter,
                "app_id": app["id"],
                "prev": "NULL" if idx == 0 else f"'{status_order[idx-1]}'",
                "curr": step,
                "by": "admin@placement.edu",
                "remarks": f"Cleared round: {step}",
                "date": app["applied_date"]
            })
            history_counter += 1
        history.append({
            "id": history_counter,
            "app_id": app["id"],
            "prev": f"'{status_order[rej_idx]}'",
            "curr": "REJECTED",
            "by": "admin@placement.edu",
            "remarks": "Could not clear screening round evaluation.",
            "date": app["applied_date"]
        })
        history_counter += 1
    else:
        # Progress normally up to current status
        final_idx = status_order.index(cur_status)
        for idx in range(final_idx + 1):
            step = status_order[idx]
            history.append({
                "id": history_counter,
                "app_id": app["id"],
                "prev": "NULL" if idx == 0 else f"'{status_order[idx-1]}'",
                "curr": step,
                "by": "admin@placement.edu",
                "remarks": f"Stage cleared: {step}",
                "date": app["applied_date"]
            })
            history_counter += 1

# Generate Interviews
print("Generating interviews...")
interviews = []
interview_students = []
interview_id_counter = 1

rounds = ["Aptitude Test", "Technical Round 1", "HR Interview", "Group Discussion", "Final Director Round"]

for c in companies:
    # Schedule 1-2 interviews per company
    for i in range(random.randint(1, 2)):
        round_name = random.choice(rounds)
        int_date = datetime.datetime.now() + datetime.timedelta(days=random.randint(5, 30))
        venue = random.choice(["Auditorium Block A", "Seminar Hall Ground Floor", "Virtual Teams Link", "TPO Interview Room 2"])
        meeting = "https://teams.microsoft.com/mock-link" if "Virtual" in venue else ""
        
        interviews.append({
            "id": interview_id_counter,
            "company_id": c["id"],
            "round_name": round_name,
            "date": int_date.strftime("%Y-%m-%d %H:%M:%S"),
            "venue": venue,
            "meeting": f"'{meeting}'" if meeting else "NULL",
            "instructions": "Bring 2 copies of resume and academic sheets. Wear professional formals.",
            "remarks": "Please report 15 mins prior."
        })
        
        # Assign some students who applied to this company
        assigned_apps = [a for a in applications if a["company_id"] == c["id"]]
        for app in assigned_apps[:random.randint(5, 15)]:
            interview_students.append({
                "interview_id": interview_id_counter,
                "student_id": app["student_id"]
            })
            
        interview_id_counter += 1

# Generate Notifications
notifications = []
notif_id_counter = 1

# General Announcements
for c in companies:
    notifications.append({
        "id": notif_id_counter,
        "student_id": "NULL",
        "title": f"Drives Registration Opened: {c['name']}",
        "message": f"Applications are now open for {c['name']} recruitment drive. Package CTC: {c['package']} LPA.",
        "type": "COMPANY_ANNOUNCEMENT",
        "is_read": 0,
        "date": (datetime.datetime.now() - datetime.timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S")
    })
    notif_id_counter += 1

# Student specific notifications
for app in applications[:150]:
    if app["status"] == "SELECTED":
        notifications.append({
            "id": notif_id_counter,
            "student_id": app["student_id"],
            "title": f"Selection Outcome - Congratulations!",
            "message": f"Congratulations! You have been selected for the role at company {companies[app['company_id']-1]['name']}.",
            "type": "RESULT_UPDATE",
            "is_read": random.randint(0, 1),
            "date": app["applied_date"]
        })
        notif_id_counter += 1
    elif app["status"] == "REJECTED":
        notifications.append({
            "id": notif_id_counter,
            "student_id": app["student_id"],
            "title": f"Recruitment Round Update - {companies[app['company_id']-1]['name']}",
            "message": f"Thank you for participating. Your status was updated to REJECTED for the drive.",
            "type": "RESULT_UPDATE",
            "is_read": 1,
            "date": app["applied_date"]
        })
        notif_id_counter += 1

# Write SQL script
sql_file = "s:/job_notification/database/sample_data.sql"
with open(sql_file, "w", encoding="utf-8") as f:
    f.write("-- Large Realistic Sample Data Seed for placement_db\n")
    f.write("USE placement_db;\n\n")
    f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
    f.write("TRUNCATE TABLE notifications;\n")
    f.write("TRUNCATE TABLE resources;\n")
    f.write("TRUNCATE TABLE interview_students;\n")
    f.write("TRUNCATE TABLE interviews;\n")
    f.write("TRUNCATE TABLE status_history;\n")
    f.write("TRUNCATE TABLE applications;\n")
    f.write("TRUNCATE TABLE companies;\n")
    f.write("TRUNCATE TABLE students;\n")
    f.write("TRUNCATE TABLE admins;\n")
    f.write("TRUNCATE TABLE audit_logs;\n")
    f.write("SET FOREIGN_KEY_CHECKS = 1;\n\n")
    
    # 1. Admin Seed
    f.write("-- Seed Administrators\n")
    f.write("INSERT INTO admins (admin_id, email, password_hash, name) VALUES\n")
    f.write(f"(1, 'tpo@university.edu', '{hash_pass}', 'Dr. Aris (Placement Director)'),\n")
    f.write(f"(2, 'admin@placement.edu', '{hash_pass}', 'Sarah Connor (TPO Coordinator)');\n\n")
    
    # 2. Students Seed
    f.write("-- Seed Students (200 Records)\n")
    f.write("INSERT INTO students (student_id, reg_no, name, email, password_hash, department, cgpa, phone, resume_url, resume_file_name, resume_uploaded_at) VALUES\n")
    for idx, s in enumerate(students):
        end = ";\n\n" if idx == len(students) - 1 else ",\n"
        f.write(f"({s['id']}, '{s['reg_no']}', '{s['name']}', '{s['email']}', '{hash_pass}', '{s['dept']}', {s['cgpa']}, '{s['phone']}', {s['resume_url']}, {s['resume_file_name']}, {s['resume_uploaded_at']}){end}")
        
    # 3. Companies Seed
    f.write("-- Seed Companies (15 Records)\n")
    f.write("INSERT INTO companies (company_id, company_name, description, eligibility_cgpa, eligible_departments, package_amount, application_deadline, drive_date, active) VALUES\n")
    for idx, c in enumerate(companies):
        end = ";\n\n" if idx == len(companies) - 1 else ",\n"
        f.write(f"({c['id']}, '{c['name']}', '{c['desc']}', {c['cgpa']}, '{c['depts']}', {c['package']}, '{c['deadline']}', '{c['drive_date']}', TRUE){end}")
        
    # 4. Applications Seed
    f.write("-- Seed Applications (500+ Records)\n")
    f.write("INSERT INTO applications (application_id, student_id, company_id, applied_date, status) VALUES\n")
    for idx, app in enumerate(applications):
        end = ";\n\n" if idx == len(applications) - 1 else ",\n"
        f.write(f"({app['id']}, {app['student_id']}, {app['company_id']}, '{app['applied_date']}', '{app['status']}'){end}")
        
    # 5. Status History Seed
    f.write("-- Seed Status History Logs\n")
    f.write("INSERT INTO status_history (history_id, application_id, previous_status, current_status, updated_by, remarks, updated_at) VALUES\n")
    for idx, h in enumerate(history):
        end = ";\n\n" if idx == len(history) - 1 else ",\n"
        f.write(f"({h['id']}, {h['app_id']}, {h['prev']}, '{h['curr']}', '{h['by']}', '{h['remarks']}', '{h['date']}'){end}")
        
    # 6. Interviews Seed
    f.write("-- Seed Interviews\n")
    f.write("INSERT INTO interviews (interview_id, company_id, round_name, interview_date, venue, meeting_link, instructions, remarks) VALUES\n")
    for idx, i in enumerate(interviews):
        end = ";\n\n" if idx == len(interviews) - 1 else ",\n"
        f.write(f"({i['id']}, {i['company_id']}, '{i['round_name']}', '{i['date']}', '{i['venue']}', {i['meeting']}, '{i['instructions']}', '{i['remarks']}'){end}")
        
    # 7. Interview Students Join Seed
    f.write("-- Seed Interview Students Assignment Mapping\n")
    f.write("INSERT INTO interview_students (interview_id, student_id) VALUES\n")
    for idx, j in enumerate(interview_students):
        end = ";\n\n" if idx == len(interview_students) - 1 else ",\n"
        f.write(f"({j['interview_id']}, {j['student_id']}){end}")
        
    # 8. Notifications Seed
    f.write("-- Seed Notifications\n")
    f.write("INSERT INTO notifications (notification_id, student_id, title, message, type, is_read, created_at) VALUES\n")
    for idx, n in enumerate(notifications):
        end = ";\n\n" if idx == len(notifications) - 1 else ",\n"
        f.write(f"({n['id']}, {n['student_id']}, '{n['title']}', '{n['message']}', '{n['type']}', {n['is_read']}, '{n['date']}'){end}")

print("SQL script written successfully!")
