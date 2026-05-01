import matplotlib.pyplot as plt

def create_diagram():
    # Replace the following lines with your logic to generate diagrams
    plt.figure(figsize=(10, 6))
    plt.title('Sample Architecture Diagram')
    plt.xlabel('X-axis Label')
    plt.ylabel('Y-axis Label')
    plt.plot([1, 2, 3], [1, 4, 9], marker='o')
    plt.grid()
    plt.savefig('architecture_diagram.png')
    plt.show()

if __name__ == "__main__":
    create_diagram()