
from app.rag import retrieve_vulnerabilities

question = "Which Microsoft vulnerabilities are associated with ransomware?"

results = retrieve_vulnerabilities(question, top_k=5)

if not results:
    print("No matching vulnerabilities found.")
else:
    for item in results:
        print("-" * 60)
        print("CVE:", item["cve_id"])
        print("Vendor:", item["vendor"])
        print("Product:", item["product"])
        print("Name:", item["vulnerability_name"])
        print("Description:", item["description"])
        print("Ransomware use:", item["known_ransomware_use"])
        print("Relevance score:", item["relevance_score"])
