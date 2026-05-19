from app import create_app, db
from app.models import ParentStudentMapping

app = create_app()

with app.app_context():
    print("Cleaning up multiple mappings per chat_id...")
    # Get all mappings that have a telegram_chat_id
    mappings = ParentStudentMapping.query.filter(ParentStudentMapping.telegram_chat_id != None).all()
    
    # Group by chat_id
    chat_dict = {}
    for m in mappings:
        chat_id = m.telegram_chat_id
        if chat_id not in chat_dict:
            chat_dict[chat_id] = []
        chat_dict[chat_id].append(m)
        
    for chat_id, maps in chat_dict.items():
        if len(maps) > 1:
            print(f"Chat {chat_id} has {len(maps)} mappings. Keeping only the most recently linked parent.")
            # Since we can't easily know the most recent, we'll just keep the one with the highest parent_id
            # Assuming higher parent_id = created later
            highest_parent_id = max([m.parent_id for m in maps])
            
            for m in maps:
                if m.parent_id != highest_parent_id:
                    m.telegram_chat_id = None
                    print(f"  Unlinked mapping for parent_id {m.parent_id}")
                    
    db.session.commit()
    print("Cleanup complete.")
